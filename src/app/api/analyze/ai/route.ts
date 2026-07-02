import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzePatentIdea, createMockAnalysis } from "@/lib/api/openai";
import { withTimeout } from "@/lib/api/timeout";
import type { PatentResult, NtisProject, MarketData, PolicyInfo } from "@/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const AI_TIMEOUT_MS = process.env.VERCEL ? 9500 : 90000;

const aiSchema = z.object({
  query: z.string().min(1).max(200),
  patentCount: z.number(),
  patents: z.array(z.object({
    applicationNumber: z.string(),
    title: z.string(),
    applicant: z.string(),
    applicationDate: z.string(),
    registrationStatus: z.string(),
    ipc: z.string(),
    abstract: z.string(),
  })),
  ntisProjects: z.array(z.object({
    projectId: z.string(),
    title: z.string(),
    organization: z.string(),
    budget: z.string(),
    participants: z.array(z.string()),
    outcomes: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  })),
  marketData: z.array(z.object({
    marketName: z.string(),
    marketSize: z.string(),
    growthRate: z.string(),
    year: z.string(),
    source: z.string(),
  })),
  policies: z.array(z.object({
    title: z.string(),
    department: z.string(),
    summary: z.string(),
    url: z.string(),
    publishedDate: z.string(),
  })),
});

/** AI 분석만 수행 (OpenRouter) — 항상 JSON 반환 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = aiSchema.parse(body);

    const input = {
      query: parsed.query,
      patents: parsed.patents as PatentResult[],
      ntisProjects: parsed.ntisProjects as NtisProject[],
      marketData: parsed.marketData as MarketData[],
      policies: parsed.policies as PolicyInfo[],
      patentCount: parsed.patentCount,
    };

    const analysisResult = await withTimeout(
      analyzePatentIdea(input),
      AI_TIMEOUT_MS,
      () => ({
        data: createMockAnalysis(input),
        source: "mock" as const,
        message: "AI 분석 시간 초과 — 무료 모델 응답 지연으로 Mock 표시",
      })
    );

    const analysis = {
      ...analysisResult.data,
      similarPatentCount: parsed.patentCount,
    };

    return NextResponse.json({
      analysis,
      source: analysisResult.source,
      message: analysisResult.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
    }
    console.error("AI analyze error:", error);
    return NextResponse.json({
      analysis: createMockAnalysis({
        query: "unknown",
        patents: [],
        ntisProjects: [],
        marketData: [],
        policies: [],
        patentCount: 0,
      }),
      source: "mock",
      message: "AI 분석 오류 — Mock 결과 표시",
    });
  }
}
