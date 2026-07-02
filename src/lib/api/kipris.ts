import type { ApiResult } from "@/lib/api/types";
import type { PatentResult } from "@/types";
import { getEnv } from "@/lib/api/env";
import { formatKiprisDate, getXmlItems, getXmlText } from "@/lib/api/xml";

const KIPRIS_BASE_URL = "https://plus.kipris.or.kr/kipo-api/kipi";

export interface PatentSearchResult {
  patents: PatentResult[];
  totalCount: number;
}

export async function searchPatents(query: string): Promise<ApiResult<PatentSearchResult>> {
  const apiKey = getEnv("KIPRIS_API_KEY");

  if (!apiKey) {
    return {
      data: {
        patents: getMockPatentResults(query),
        totalCount: 230,
      },
      source: "mock",
      message: "KIPRIS_API_KEY 미설정 — Vercel 환경변수 등록 후 Redeploy 필요",
    };
  }

  try {
    const params = new URLSearchParams({
      ServiceKey: apiKey,
      word: query,
      numOfRows: "50",
      pageNo: "1",
    });

    const response = await fetch(
      `${KIPRIS_BASE_URL}/patUtiModInfoSearchSevice/getWordSearch?${params}`,
      {
        cache: "no-store",
        headers: { Accept: "application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(15000),
      }
    );

    const xml = await response.text();

    if (!response.ok) {
      throw new Error(`KIPRIS HTTP ${response.status}`);
    }

    const successYN = getXmlText(xml, "successYN");
    const resultCode = getXmlText(xml, "resultCode");

    if (successYN !== "Y" || (resultCode && resultCode !== "00")) {
      throw new Error(`KIPRIS API error: ${getXmlText(xml, "resultMsg") || resultCode}`);
    }

    const totalCount = parseInt(getXmlText(xml, "totalCount") || "0", 10);
    const items = getXmlItems(xml);
    const patents = items.map(mapKiprisItem);

    if (patents.length === 0 && totalCount === 0) {
      return {
        data: { patents: [], totalCount: 0 },
        source: "live",
      };
    }

    return {
      data: {
        patents,
        totalCount: totalCount || patents.length,
      },
      source: "live",
    };
  } catch (error) {
    console.error("KIPRIS API failed:", error);
    return {
      data: {
        patents: getMockPatentResults(query),
        totalCount: 230,
      },
      source: "mock",
      message: error instanceof Error ? error.message : "KIPRIS API 호출 실패",
    };
  }
}

function mapKiprisItem(item: Record<string, string>): PatentResult {
  return {
    applicationNumber: formatApplicationNumber(item.applicationNumber),
    title: item.inventionTitle || "",
    applicant: item.applicantName || "",
    applicationDate: formatKiprisDate(item.applicationDate),
    registrationStatus: item.registerStatus || "미등록",
    ipc: (item.ipcNumber || "").split("|")[0]?.trim() || "",
    abstract: item.astrtCont || "",
  };
}

function formatApplicationNumber(value: string): string {
  if (!value || value.includes("-")) return value;
  if (value.length === 13) {
    return `${value.slice(0, 2)}-${value.slice(2, 6)}-${value.slice(6)}`;
  }
  return value;
}

function getMockPatentResults(query: string): PatentResult[] {
  const competitors = [
    "Hanwha Vision",
    "LG CNS",
    "SK쉴더스",
    "삼성전자",
    "ETRI",
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    applicationNumber: `10-202${3 + (i % 2)}-${String(100000 + i * 1111).slice(0, 6)}`,
    title: `${query} 관련 기술 - ${["영상분석", "이벤트탐지", "객체인식", "이상행동감지", "멀티모달분석"][i % 5]} 시스템 및 방법`,
    applicant: competitors[i % competitors.length],
    applicationDate: `202${3 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    registrationStatus: i % 3 === 0 ? "등록" : "출원",
    ipc: `G06V${10 + (i % 5)}/00`,
    abstract: `${query} 기술을 활용한 Mock 데이터입니다.`,
  }));
}

export async function getPatentCount(query: string): Promise<number> {
  const result = await searchPatents(query);
  return result.data.totalCount;
}
