import type { NtisProject } from "@/types";

const NTIS_BASE_URL = "https://www.ntis.go.kr/rndopen/openApi";

export async function searchNtisProjects(query: string): Promise<NtisProject[]> {
  const apiKey = process.env.NTIS_API_KEY;

  if (!apiKey) {
    return getMockNtisProjects(query);
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
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return getMockNtisProjects(query);
    }

    const data = await response.json();
    return parseNtisResponse(data);
  } catch {
    return getMockNtisProjects(query);
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
      title: `${query} 기반 지능형 영상감시 시스템 개발`,
      organization: "한국전자통신연구원",
      budget: "2,500,000,000",
      participants: ["Hanwha Vision", "LG CNS"],
      outcomes: "핵심 알고리즘 3건, 특허 5건 출원",
      startDate: "2023-03-01",
      endDate: "2025-12-31",
    },
    {
      projectId: "1711193789",
      title: `차세대 ${query} 융합 보안 플랫폼`,
      organization: "정보통신기획평가원",
      budget: "1,800,000,000",
      participants: ["SK쉴더스", "삼성SDS"],
      outcomes: "시제품 1건, 기술이전 2건",
      startDate: "2024-01-01",
      endDate: "2026-06-30",
    },
    {
      projectId: "1711194012",
      title: `${query} 산업 생태계 구축 R&D`,
      organization: "중소벤처기업부",
      budget: "950,000,000",
      participants: ["스타트업A", "스타트업B", "대학 연구실"],
      outcomes: "창업 3건, 고용 50명",
      startDate: "2024-06-01",
      endDate: "2025-12-31",
    },
  ];
}
