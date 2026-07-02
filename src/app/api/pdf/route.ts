import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePDFReport } from "@/lib/pdf/generator";
import type { AnalysisResult } from "@/types";

const pdfSchema = z.object({
  query: z.string().min(1).max(200),
  analysis: z.object({
    patentabilityScore: z.number(),
    similarPatentCount: z.number(),
    competitors: z.array(z.string()),
    differentiationStrategy: z.string(),
    marketPotential: z.object({
      marketSize: z.string(),
      growthRate: z.string(),
      summary: z.string(),
    }),
    governmentSupport: z.array(z.string()),
    risks: z.array(z.string()),
    recommendedActions: z.array(z.string()),
    technicalDifficulty: z.string(),
    recommendedBM: z.string(),
    developmentPeriod: z.string(),
    investmentPotential: z.string(),
    fullReport: z.string(),
    similarPatents: z.array(z.any()).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, analysis } = pdfSchema.parse(body);

    const pdfBuffer = generatePDFReport(query, analysis as AnalysisResult);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="patentpilot-${encodeURIComponent(query)}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 데이터입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "PDF 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
