import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPatents } from "@/lib/api/kipris";
import { getMarketData } from "@/lib/api/kosis";
import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/api/timeout";
import type { ApiResult } from "@/lib/api/types";
import type { DataSourcesMeta } from "@/lib/api/types";
import type { PatentSearchResult } from "@/lib/api/kipris";
import type { MarketData } from "@/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const analyzeSchema = z.object({
  query: z.string().min(1).max(200),
});

const DATA_TIMEOUT_MS = process.env.VERCEL ? 5500 : 25000;
const SUPABASE_TIMEOUT_MS = process.env.VERCEL ? 2000 : 8000;

async function getSupabaseUser(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>) {
  const result = await withTimeout(
    supabase.auth.getUser(),
    SUPABASE_TIMEOUT_MS,
    () => null
  );
  return result ?? { data: { user: null }, error: null };
}

/** 특허·시장 데이터만 빠르게 조회 (AI 제외) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = analyzeSchema.parse(body);

    const supabase = await createClient();
    let user = null;

    if (supabase) {
      const authResult = await getSupabaseUser(supabase);
      user = authResult.data.user;

      if (user) {
        const profileQuery = supabase
          .from("profiles")
          .select("search_count, search_limit, plan")
          .eq("id", user.id)
          .single();

        const profileResult = await withTimeout(
          Promise.resolve(profileQuery),
          SUPABASE_TIMEOUT_MS,
          () => null
        );
        const profile = profileResult?.data ?? null;

        if (profile && profile.plan === "starter" && profile.search_count >= profile.search_limit) {
          return NextResponse.json(
            { error: "월 검색 한도를 초과했습니다. Pro 플랜으로 업그레이드하세요." },
            { status: 429 }
          );
        }
      }
    }

    const [patentResult, marketResult] = await Promise.all([
      withTimeout<ApiResult<PatentSearchResult>>(
        searchPatents(query),
        DATA_TIMEOUT_MS,
        () => ({
          data: { patents: [], totalCount: 0 },
          source: "mock",
          message: "KIPRIS 시간 초과",
        })
      ),
      withTimeout<ApiResult<MarketData[]>>(
        getMarketData(query),
        DATA_TIMEOUT_MS,
        () => ({
          data: [{ marketName: "시장 데이터", marketSize: "-", growthRate: "-", year: "-", source: "Mock" }],
          source: "mock",
          message: "KOSIS 시간 초과",
        })
      ),
    ]);

    const sources: DataSourcesMeta = {
      patents: patentResult.source,
      market: marketResult.source,
      analysis: "mock",
    };

    const messages = {
      patents: patentResult.message,
      market: marketResult.message,
      analysis: "AI 분석 대기 중",
    };

    if (user && supabase) {
      const countQuery = supabase
        .from("profiles")
        .select("search_count")
        .eq("id", user.id)
        .single();

      const profileResult = await withTimeout(
        Promise.resolve(countQuery),
        SUPABASE_TIMEOUT_MS,
        () => null
      );
      const profile = profileResult?.data ?? null;

      if (profile) {
        void supabase
          .from("profiles")
          .update({ search_count: profile.search_count + 1 })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      query,
      patents: patentResult.data.patents,
      patentCount: patentResult.data.totalCount,
      marketData: marketResult.data,
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
