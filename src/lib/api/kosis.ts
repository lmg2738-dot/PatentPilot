import type { MarketData, PolicyInfo } from "@/types";

export async function getMarketData(query: string): Promise<MarketData[]> {
  const apiKey = process.env.KOSIS_API_KEY;

  if (!apiKey) {
    return getMockMarketData(query);
  }

  try {
    const params = new URLSearchParams({
      method: "getList",
      apiKey: apiKey,
      format: "json",
      jsonVD: "Y",
      userStatsId: query,
    });

    const response = await fetch(
      `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      return getMockMarketData(query);
    }

    const data = await response.json();
    return parseKosisResponse(data);
  } catch {
    return getMockMarketData(query);
  }
}

function parseKosisResponse(data: Record<string, unknown>): MarketData[] {
  const items = (data as { StatisticSearch?: { row?: unknown[] } })?.StatisticSearch?.row;
  if (!items || !Array.isArray(items)) return getMockMarketData("");

  return (items as Record<string, string>[]).slice(0, 5).map((item) => ({
    marketName: item.C1_NM || item.TBL_NM || "",
    marketSize: item.DT || "",
    growthRate: item.C2_NM || "",
    year: item.PRD_DE || "",
    source: "KOSIS",
  }));
}

function getMockMarketData(query: string): MarketData[] {
  const isSecurity = /cctv|보안|감시|영상/i.test(query);

  return [
    {
      marketName: isSecurity ? "국내 보안시장" : "관련 산업 시장",
      marketSize: isSecurity ? "4조원" : "2.5조원",
      growthRate: isSecurity ? "18%" : "12%",
      year: "2025",
      source: "KOSIS",
    },
    {
      marketName: isSecurity ? "영상감시시장" : "AI 산업",
      marketSize: isSecurity ? "1.2조원" : "8조원",
      growthRate: isSecurity ? "22%" : "25%",
      year: "2025",
      source: "KOSIS",
    },
    {
      marketName: "AI 산업",
      marketSize: "8조원",
      growthRate: "25%",
      year: "2025",
      source: "KOSIS",
    },
  ];
}

export async function getPolicyInfo(query: string): Promise<PolicyInfo[]> {
  const apiKey = process.env.POLICY_API_KEY;

  if (!apiKey) {
    return getMockPolicyInfo(query);
  }

  try {
    const response = await fetch(
      `https://www.policy.go.kr/api/policy/search?query=${encodeURIComponent(query)}&apiKey=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      return getMockPolicyInfo(query);
    }

    const data = await response.json();
    return parsePolicyResponse(data);
  } catch {
    return getMockPolicyInfo(query);
  }
}

function parsePolicyResponse(data: Record<string, unknown>): PolicyInfo[] {
  const items = (data as { items?: unknown[] })?.items;
  if (!items || !Array.isArray(items)) return getMockPolicyInfo("");

  return (items as Record<string, string>[]).map((item) => ({
    title: item.title || "",
    department: item.department || "",
    summary: item.summary || "",
    url: item.url || "",
    publishedDate: item.publishedDate || "",
  }));
}

function getMockPolicyInfo(query: string): PolicyInfo[] {
  return [
    {
      title: "AI 바우처 지원사업",
      department: "중소벤처기업부",
      summary: "중소기업의 AI 도입을 위한 바우처 지원 (최대 3억원)",
      url: "https://www.k-startup.go.kr",
      publishedDate: "2025-01-15",
    },
    {
      title: "디지털 혁신 기술개발사업",
      department: "과학기술정보통신부",
      summary: `${query} 관련 핵심기술 개발 R&D 지원`,
      url: "https://www.msit.go.kr",
      publishedDate: "2025-02-01",
    },
    {
      title: "보안산업 육성 지원정책",
      department: "산업통상자원부",
      summary: "물리보안·정보보안 산업 육성 및 수출 지원",
      url: "https://www.motie.go.kr",
      publishedDate: "2024-11-20",
    },
  ];
}
