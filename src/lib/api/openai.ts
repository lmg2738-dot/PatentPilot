import { PATENT_ANALYST_PROMPT, PATENT_ANALYST_PROMPT_FAST, PATENT_DRAFT_PROMPT } from "@/lib/prompts";
import { createFreeChatCompletion } from "@/lib/api/openrouter/client";
import { getEnv } from "@/lib/api/env";
import type { ApiResult } from "@/lib/api/types";
import type { AnalysisResult, PatentResult, MarketData } from "@/types";

interface AnalyzeInput {
  query: string;
  patents: PatentResult[];
  marketData: MarketData[];
  patentCount: number;
}

export async function analyzePatentIdea(input: AnalyzeInput): Promise<ApiResult<AnalysisResult>> {
  if (!getEnv("OPENROUTER_API_KEY")) {
    return {
      data: getMockAnalysis(input),
      source: "mock",
      message: "OPENROUTER_API_KEY 미설정 — Vercel 환경변수 등록 후 Redeploy 필요",
    };
  }

  try {
    const isVercel = Boolean(process.env.VERCEL);
    const context = buildAnalysisContext(input, isVercel);

    const result = await createFreeChatCompletion({
      messages: [
        {
          role: "system",
          content: isVercel ? PATENT_ANALYST_PROMPT_FAST : PATENT_ANALYST_PROMPT,
        },
        { role: "user", content: context },
      ],
      temperature: 0.3,
      max_tokens: isVercel ? 450 : 1500,
      fast: isVercel,
    });

    const { content, model } = result;

    return {
      data: parseAnalysisResponse(content, input),
      source: "live",
      message: `OpenRouter (${model})`,
    };
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.message === "AI_TIMEOUT" || error.message.toLowerCase().includes("timeout"));
    console.error("OpenRouter analysis failed, using mock:", error);
    return {
      data: getMockAnalysis(input),
      source: "mock",
      message: isTimeout
        ? "AI 분석 시간 초과 — 무료 모델 응답 지연으로 Mock 표시"
        : error instanceof Error
          ? error.message
          : "OpenRouter API 호출 실패",
    };
  }
}

export async function generatePatentDraft(idea: string): Promise<string> {
  if (!getEnv("OPENROUTER_API_KEY")) {
    return getMockPatentDraft(idea);
  }

  try {
    const { content } = await createFreeChatCompletion({
      messages: [
        { role: "system", content: PATENT_DRAFT_PROMPT },
        { role: "user", content: `발명 아이디어: ${idea}` },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    return content;
  } catch (error) {
    console.error("OpenRouter patent draft failed, using mock:", error);
    return getMockPatentDraft(idea);
  }
}

function buildAnalysisContext(input: AnalyzeInput, compact = false): string {
  const patentLines = input.patents
    .slice(0, compact ? 2 : 10)
    .map((p) =>
      compact
        ? `- ${p.title} (${p.applicant})`
        : `- [${p.applicationNumber}] ${p.title} (출원인: ${p.applicant}, IPC: ${p.ipc})`
    )
    .join("\n");

  if (compact) {
    return `아이디어: ${input.query}
유사특허 ${input.patentCount}건
${patentLines}
시장: ${input.marketData[0]?.marketName || "-"} ${input.marketData[0]?.marketSize || "-"} 성장 ${input.marketData[0]?.growthRate || "-"}`;
  }

  return `
## 분석 대상 아이디어
${input.query}

## 특허 검색 결과 (총 ${input.patentCount}건)
${patentLines}

## 시장 데이터
${input.marketData.map((m) => `- ${m.marketName}: ${m.marketSize}, 성장률 ${m.growthRate}`).join("\n")}
`;
}

function parseStructuredJson(content: string): Record<string, unknown> {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // continue
    }
  }

  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // continue
    }
  }

  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      // continue
    }
  }

  return {};
}

function parseAnalysisResponse(content: string, input: AnalyzeInput): AnalysisResult {
  const structured = parseStructuredJson(content);

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
      summary: (structured.marketSummary as string) ||
        "시장 성장세가 양호하며 사업 기회가 큽니다.",
    },
    governmentSupport: (structured.governmentSupport as string[]) || [
      "중소기업 R&D 지원사업",
      "AI 바우처 지원사업",
    ],
    risks: (structured.risks as string[]) || [
      "대기업의 선행 특허 다수 존재",
      "기술 표준화 경쟁 심화",
      "규제 환경 변화 가능성",
    ],
    recommendedActions: (structured.recommendedActions as string[]) || [
      "선행기술조사 심화 수행",
      "차별화 포인트 명확화",
      "프로토타입 개발 착수",
    ],
    technicalDifficulty: (structured.technicalDifficulty as string) || "중상",
    recommendedBM: (structured.recommendedBM as string) || "B2B SaaS + 하드웨어 번들",
    developmentPeriod: (structured.developmentPeriod as string) || "12-18개월",
    investmentPotential: (structured.investmentPotential as string) || "높음",
    fullReport: content,
  };
}

export function createMockAnalysis(input: AnalyzeInput): AnalysisResult {
  return getMockAnalysis(input);
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
    governmentSupport: ["중소기업 R&D 지원사업", "AI 바우처 지원사업"],
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
