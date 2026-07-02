import type { ApiResult } from "@/lib/api/types";
import type { NtisProject } from "@/types";
import { getEnv } from "@/lib/api/env";

const NTIS_BASE_URL = "https://www.ntis.go.kr/rndopen/openApi";

export async function searchNtisProjects(query: string): Promise<ApiResult<NtisProject[]>> {
  const apiKey = getEnv("NTIS_API_KEY");

  if (!apiKey) {
    return {
      data: getMockNtisProjects(query),
      source: "mock",
      message: "NTIS_API_KEY 미설정 (선택)",
    };
  }

  try {
    const params = new URLSearchParams({
      apkey: apiKey,
      query: query,
      displayCount: "20",
      startPosition: "1",
    });

    const response = await fetch(
      `${NTIS_BASE_URL}/public_project?${params}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      throw new Error(`NTIS HTTP ${response.status}`);
    }

    const data = await response.json();
    const projects = parseNtisResponse(data);

    if (projects.length === 0) {
      throw new Error("NTIS 검색 결과 없음");
    }

    return { data: projects, source: "live" };
  } catch (error) {
    console.error("NTIS API failed:", error);
    return {
      data: getMockNtisProjects(query),
      source: "mock",
      message: error instanceof Error ? error.message : "NTIS API 호출 실패",
    };
  }
}

function parseNtisResponse(data: Record<string, unknown>): NtisProject[] {
  const items = (data as { RESULT?: { DATA?: unknown[] } })?.RESULT?.DATA;
  if (!items || !Array.isArray(items)) return [];

  return (items as Record<string, string>[]).map((item) => ({
    projectId: item.ProjectNumber || "",
    title: item.ProjectTitle || "",
    organization: item.ResearchAgency || "",
    budget: item.GovernmentFunds || "0",
    participants: (item.ParticipatingCompany || "").split(",").filter(Boolean),
    outcomes: item.ResearchOutcome || "",
    startDate: item.StartDate || "",
    endDate: item.EndDate || "",
  }));
}

function getMockNtisProjects(query: string): NtisProject[] {
  return [
    {
      projectId: "1711193456",
      title: `${query} 기반 지능형 영상감시 시스템 개발 (Mock)`,
      organization: "한국전자통신연구원",
      budget: "2,500,000,000",
      participants: ["Hanwha Vision", "LG CNS"],
      outcomes: "Mock 데이터",
      startDate: "2023-03-01",
      endDate: "2025-12-31",
    },
  ];
}
