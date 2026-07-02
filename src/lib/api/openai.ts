import { PATENT_ANALYST_PROMPT, PATENT_DRAFT_PROMPT } from "@/lib/prompts";
import { createFreeChatCompletion } from "@/lib/api/openrouter/client";
import type { AnalysisResult, PatentResult, NtisProject, MarketData, PolicyInfo } from "@/types";

interface AnalyzeInput {
  query: string;
  patents: PatentResult[];
  ntisProjects: NtisProject[];
  marketData: MarketData[];
  policies: PolicyInfo[];
  patentCount: number;
}

export async function analyzePatentIdea(input: AnalyzeInput): Promise<AnalysisResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return getMockAnalysis(input);
  }

  try {
    const context = buildAnalysisContext(input);

    const { content } = await createFreeChatCompletion({
      messages: [
        { role: "system", content: PATENT_ANALYST_PROMPT },
        { role: "user", content: context },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return parseAnalysisResponse(content, input);
  } catch (error) {
    console.error("OpenRouter analysis failed, using mock:", error);
    return getMockAnalysis(input);
  }
}

export async function generatePatentDraft(idea: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    return getMockPatentDraft(idea);
  }

  try {
    const { content } = await createFreeChatCompletion({
      messages: [
        { role: "system", content: PATENT_DRAFT_PROMPT },
        { role: "user", content: `발명 아이디어: ${idea}` },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    return content;
  } catch (error) {
    console.error("OpenRouter patent draft failed, using mock:", error);
    return getMockPatentDraft(idea);
  }
}

function buildAnalysisContext(input: AnalyzeInput): string {
  return `
## 분석 대상 아이디어
${input.query}

## 특허 검색 결과 (총 ${input.patentCount}건)
${input.patents.slice(0, 10).map((p) => `- [${p.applicationNumber}] ${p.title} (출원인: ${p.applicant}, IPC: ${p.ipc})`).join("\n")}

## NTIS R&D 과제
${input.ntisProjects.map((p) => `- ${p.title} (${p.organization}, 예산: ${p.budget}원)`).join("\n")}

## 시장 데이터
${input.marketData.map((m) => `- ${m.marketName}: ${m.marketSize}, 성장률 ${m.growthRate}`).join("\n")}

## 관련 정책
${input.policies.map((p) => `- ${p.title} (${p.department})`).join("\n")}
`;
}

function parseAnalysisResponse(content: string, input: AnalyzeInput): AnalysisResult {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  let structured: Record<string, unknown> = {};

  if (jsonMatch) {
    try {
      structured = JSON.parse(jsonMatch[1]);
    } catch {
      // JSON 파싱 실패 시 기본값 사용
    }
  }

  const competitors = (structured.competitors as string[]) ||
    [...new Set(input.patents.map((p) => p.applicant))].slice(0, 5);

  return {
    patentabilityScore: (structured.patentabilityScore as number) || 78,
    similarPatentCount: input.patentCount,
    similarPatents: input.patents.slice(0, 5),
    competitors,
    differentiationStrategy: (structured.differentiationStrategy as string) ||
      "영상분석 대신 멀티모달 이벤트 탐지 기술로 접근하면 등록 가능성이 높습니다.",
    marketPotential: {
      marketSize: (structured.marketSize as string) || input.marketData[0]?.marketSize || "4조원",
      growthRate: (structured.growthRate as string) || input.marketData[0]?.growthRate || "18%",
      summary: "시장 성장세가 양호하며 정부 지원 정책과 맞물려 사업 기회가 큽니다.",
    },
    governmentSupport: (structured.governmentSupport as string[]) ||
      input.policies.map((p) => p.title),
    risks: (structured.risks as string[]) || [
      "대기업의 선행 특허 다수 존재",
      "기술 표준화 경쟁 심화",
      "규제 환경 변화 가능성",
    ],
    recommendedActions: (structured.recommendedActions as string[]) || [
      "선행기술조사 심화 수행",
      "차별화 포인트 명확화",
      "프로토타입 개발 착수",
      "정부 R&D 과제 공모 참여",
    ],
    technicalDifficulty: (structured.technicalDifficulty as string) || "중상",
    recommendedBM: (structured.recommendedBM as string) || "B2B SaaS + 하드웨어 번들",
    developmentPeriod: (structured.developmentPeriod as string) || "12-18개월",
    investmentPotential: (structured.investmentPotential as string) || "높음",
    fullReport: content,
  };
}

function getMockAnalysis(input: AnalyzeInput): AnalysisResult {
  const competitors = [...new Set(input.patents.map((p) => p.applicant))].slice(0, 5);

  return {
    patentabilityScore: 78,
    similarPatentCount: input.patentCount || 235,
    similarPatents: input.patents.slice(0, 5),
    competitors: competitors.length > 0 ? competitors : ["Hanwha Vision", "LG CNS", "SK쉴더스", "ETRI"],
    differentiationStrategy:
      "영상분석 대신 멀티모달 이벤트 탐지 기술로 접근하면 등록 가능성이 높습니다.",
    marketPotential: {
      marketSize: input.marketData[0]?.marketSize || "4조원",
      growthRate: input.marketData[0]?.growthRate || "18%",
      summary: "보안시장과 AI 산업의 동반 성장으로 시장 진입 기회가 우수합니다.",
    },
    governmentSupport: input.policies.map((p) => p.title),
    risks: [
      "대기업의 선행 특허 다수 존재",
      "대기업 경쟁 심화",
      "AI 규제 강화 가능성",
    ],
    recommendedActions: [
      "차별화 전략 수립",
      "프로토타입 개발",
      "정부 지원사업 신청",
    ],
    technicalDifficulty: "중상",
    recommendedBM: "B2B SaaS 구독 + 엣지 디바이스 판매",
    developmentPeriod: "12-18개월",
    investmentPotential: "높음",
    fullReport: generateMockReport(input),
  };
}

function generateMockReport(input: AnalyzeInput): string {
  return `# ${input.query} 특허·사업성 분석 보고서

## 1. 특허 가능성 점수: 78/100
현재 유사 특허 ${input.patentCount || 235}건이 존재합니다.

## 2. 차별화 전략
영상분석 대신 멀티모달 이벤트 탐지 기술로 접근

## 3. 시장 잠재력
- 시장규모: ${input.marketData[0]?.marketSize || "4조원"}
- 성장률: ${input.marketData[0]?.growthRate || "18%"}
`;
}

function getMockPatentDraft(idea: string): string {
  return `# 특허 명세서 초안: ${idea}

## 1. 배경기술
종래 기술에서는 ${idea} 관련 기술이 제한적으로 활용되어 왔습니다.

## 2. 발명의 내용
본 발명은 ${idea}를 활용하여 기존 기술의 문제점을 해결하는 시스템 및 방법에 관한 것이다.

## 3. 청구항 초안
**청구항 1.** ${idea}를 포함하는 시스템에 있어서, 처리부가 딥러닝 기반 알고리즘으로 데이터를 분석하는 것을 특징으로 하는 시스템.
`;
}
