import type { ApiResult } from "@/lib/api/types";
import type { MarketData, PolicyInfo } from "@/types";
import { getEnv } from "@/lib/api/env";
import { createTimeoutSignal } from "@/lib/api/timeout";

interface KosisSearchItem {
  ORG_ID?: string;
  TBL_ID?: string;
  TBL_NM?: string;
  STAT_NM?: string;
  STRT_PRD_DE?: string;
  END_PRD_DE?: string;
}

interface KosisDataRow {
  TBL_NM?: string;
  ITM_NM?: string;
  C1_NM?: string;
  DT?: string;
  PRD_DE?: string;
  UNIT_NM?: string;
}

const PRD_CYCLES = ["Y", "Q", "M"] as const;

function getSearchTerms(query: string): string[] {
  const terms: string[] = [];

  if (/cctv|보안|감시|영상|ai/i.test(query)) {
    terms.push("정보통신산업", "보안", "영상감시", "인공지능");
  }

  terms.push("산업", "시장", "경제");
  terms.push(query.split(/\s+/)[0]);

  return [...new Set(terms.filter(Boolean))].slice(0, 4);
}

function formatMarketValue(value: string, unit?: string): string {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;

  if (unit?.includes("억")) {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}조원`;
    return `${num.toLocaleString("ko-KR")}억원`;
  }

  if (unit?.includes("원") || unit?.includes("Won")) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}조원`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}억원`;
    return `${num.toLocaleString("ko-KR")}${unit || ""}`;
  }

  return `${num.toLocaleString("ko-KR")}${unit ? ` ${unit}` : ""}`;
}

function calcGrowthRate(rows: KosisDataRow[]): string {
  if (rows.length < 2) return "-";

  const latest = parseFloat(rows[0]?.DT || "0");
  const previous = parseFloat(rows[1]?.DT || "0");

  if (!latest || !previous) return "-";

  const rate = ((latest - previous) / previous) * 100;
  const sign = rate >= 0 ? "+" : "";
  return `${sign}${rate.toFixed(1)}%`;
}

async function searchStatistics(
  apiKey: string,
  searchNm: string
): Promise<KosisSearchItem[]> {
  const params = new URLSearchParams({
    method: "getList",
    apiKey,
    searchNm,
    format: "json",
    jsonVD: "Y",
    resultCount: "5",
    startCount: "1",
    sort: "RANK",
  });

  const response = await fetch(
    `https://kosis.kr/openapi/statisticsSearch.do?${params}`,
    {
      cache: "no-store",
      signal: createTimeoutSignal(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`KOSIS search HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data?.err) {
    throw new Error(`KOSIS search error: ${data.errMsg || data.err}`);
  }

  return Array.isArray(data) ? data : [];
}

async function fetchStatData(
  apiKey: string,
  orgId: string,
  tblId: string,
  prdSe: string
): Promise<KosisDataRow[]> {
  const params = new URLSearchParams({
    method: "getList",
    apiKey,
    orgId,
    tblId,
    itmId: "ALL",
    objL1: "ALL",
    prdSe,
    newEstPrdCnt: "3",
    format: "json",
    jsonVD: "Y",
  });

  const response = await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params}`,
    {
      cache: "no-store",
      signal: createTimeoutSignal(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`KOSIS data HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data?.err) {
    throw new Error(`KOSIS data error: ${data.errMsg || data.err}`);
  }

  return Array.isArray(data) ? data : [];
}

async function fetchStatDataWithFallback(
  apiKey: string,
  orgId: string,
  tblId: string
): Promise<KosisDataRow[]> {
  for (const prdSe of PRD_CYCLES) {
    try {
      const rows = await fetchStatData(apiKey, orgId, tblId, prdSe);
      if (rows.length > 0) return rows;
    } catch {
      continue;
    }
  }
  return [];
}

export async function getMarketData(query: string): Promise<ApiResult<MarketData[]>> {
  const apiKey = getEnv("KOSIS_API_KEY");

  if (!apiKey) {
    return {
      data: getMockMarketData(query),
      source: "mock",
      message: "KOSIS_API_KEY 미설정 — Vercel 환경변수 등록 후 Redeploy 필요",
    };
  }

  try {
    const searchTerms = getSearchTerms(query);
    const marketData: MarketData[] = [];
    const isVercel = Boolean(process.env.VERCEL);
    const maxTerms = isVercel ? 2 : searchTerms.length;

    for (const term of searchTerms.slice(0, maxTerms)) {
      if (marketData.length >= 3) break;

      const tables = await searchStatistics(apiKey, term);
      const maxTables = isVercel ? 2 : tables.length;

      for (const table of tables.slice(0, maxTables)) {
        if (marketData.length >= 3) break;
        if (!table.ORG_ID || !table.TBL_ID) continue;

        const rows = await fetchStatDataWithFallback(
          apiKey,
          table.ORG_ID,
          table.TBL_ID
        );
        if (rows.length === 0) continue;

        const latest = rows[0];
        marketData.push({
          marketName: latest.ITM_NM || table.TBL_NM || table.STAT_NM || term,
          marketSize: formatMarketValue(latest.DT || "-", latest.UNIT_NM),
          growthRate: calcGrowthRate(rows),
          year: latest.PRD_DE?.slice(0, 4) || table.END_PRD_DE || "-",
          source: "KOSIS",
        });
      }
    }

    if (marketData.length === 0) {
      throw new Error("KOSIS 검색 결과 없음");
    }

    return { data: marketData, source: "live" };
  } catch (error) {
    console.error("KOSIS API failed:", error);
    return {
      data: getMockMarketData(query),
      source: "mock",
      message: error instanceof Error ? error.message : "KOSIS API 호출 실패",
    };
  }
}

export async function getPolicyInfo(query: string): Promise<ApiResult<PolicyInfo[]>> {
  const apiKey = getEnv("POLICY_API_KEY");

  if (!apiKey) {
    return {
      data: getMockPolicyInfo(query),
      source: "mock",
      message: "POLICY_API_KEY 미설정 (선택)",
    };
  }

  try {
    const response = await fetch(
      `https://www.policy.go.kr/api/policy/search?query=${encodeURIComponent(query)}&apiKey=${apiKey}`,
      { cache: "no-store", signal: AbortSignal.timeout(12000) }
    );

    if (!response.ok) {
      throw new Error(`Policy API HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = (data as { items?: Record<string, string>[] })?.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("정책 검색 결과 없음");
    }

    return {
      data: items.map((item) => ({
        title: item.title || "",
        department: item.department || "",
        summary: item.summary || "",
        url: item.url || "",
        publishedDate: item.publishedDate || "",
      })),
      source: "live",
    };
  } catch (error) {
    console.error("Policy API failed:", error);
    return {
      data: getMockPolicyInfo(query),
      source: "mock",
      message: error instanceof Error ? error.message : "정책 API 호출 실패",
    };
  }
}

function getMockMarketData(query: string): MarketData[] {
  const isSecurity = /cctv|보안|감시|영상/i.test(query);

  return [
    {
      marketName: isSecurity ? "국내 보안시장 (Mock)" : "관련 산업 시장 (Mock)",
      marketSize: isSecurity ? "4조원" : "2.5조원",
      growthRate: isSecurity ? "18%" : "12%",
      year: "2025",
      source: "Mock",
    },
  ];
}

function getMockPolicyInfo(query: string): PolicyInfo[] {
  return [
    {
      title: "AI 바우처 지원사업 (Mock)",
      department: "중소벤처기업부",
      summary: `${query} 관련 Mock 정책 데이터`,
      url: "https://www.k-startup.go.kr",
      publishedDate: "2025-01-15",
    },
  ];
}
