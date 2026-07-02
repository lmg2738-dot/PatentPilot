import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPatents } from "@/lib/api/kipris";
import { searchNtisProjects } from "@/lib/api/ntis";
import { getMarketData, getPolicyInfo } from "@/lib/api/kosis";
import { createClient } from "@/lib/supabase/server";
import type { DataSourcesMeta } from "@/lib/api/types";

export const maxDuration = 30;

const analyzeSchema = z.object({
  query: z.string().min(1).max(200),
});

/** 특허·시장·R&D 데이터만 빠르게 조회 (AI 제외) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = analyzeSchema.parse(body);

    const supabase = await createClient();
    let user = null;

    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("search_count, search_limit, plan")
          .eq("id", user.id)
          .single();

        if (profile && profile.plan === "starter" && profile.search_count >= profile.search_limit) {
          return NextResponse.json(
            { error: "월 검색 한도를 초과했습니다. Pro 플랜으로 업그레이드하세요." },
            { status: 429 }
          );
        }
      }
    }

    const [patentResult, ntisResult, marketResult, policyResult] = await Promise.all([
      searchPatents(query),
      searchNtisProjects(query),
      getMarketData(query),
      getPolicyInfo(query),
    ]);

    const sources: DataSourcesMeta = {
      patents: patentResult.source,
      ntis: ntisResult.source,
      market: marketResult.source,
      policies: policyResult.source,
      analysis: "mock",
    };

    const messages = {
      patents: patentResult.message,
      ntis: ntisResult.message,
      market: marketResult.message,
      policies: policyResult.message,
      analysis: "AI 분석 대기 중",
    };

    if (user && supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("search_count")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ search_count: profile.search_count + 1 })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      query,
      patents: patentResult.data.patents,
      patentCount: patentResult.data.totalCount,
      ntisProjects: ntisResult.data,
      marketData: marketResult.data,
      policies: policyResult.data,
      sources,
      messages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
    }
    console.error("Analyze data error:", error);
    return NextResponse.json({ error: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
