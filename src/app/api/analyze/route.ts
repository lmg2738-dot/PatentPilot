import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPatents } from "@/lib/api/kipris";
import { searchNtisProjects } from "@/lib/api/ntis";
import { getMarketData, getPolicyInfo } from "@/lib/api/kosis";
import { analyzePatentIdea } from "@/lib/api/openai";
import { createClient } from "@/lib/supabase/server";
import type { DataSourcesMeta } from "@/lib/api/types";

const analyzeSchema = z.object({
  query: z.string().min(1).max(200),
});

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

    const { patents, totalCount } = patentResult.data;
    const ntisProjects = ntisResult.data;
    const marketData = marketResult.data;
    const policies = policyResult.data;

    const analysisResult = await analyzePatentIdea({
      query,
      patents,
      ntisProjects,
      marketData,
      policies,
      patentCount: totalCount,
    });

    const analysis = {
      ...analysisResult.data,
      similarPatentCount: totalCount,
    };

    const sources: DataSourcesMeta = {
      patents: patentResult.source,
      ntis: ntisResult.source,
      market: marketResult.source,
      policies: policyResult.source,
      analysis: analysisResult.source,
    };

    const messages = {
      patents: patentResult.message,
      ntis: ntisResult.message,
      market: marketResult.message,
      policies: policyResult.message,
      analysis: analysisResult.message,
    };

    if (user && supabase) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        query,
        analysis,
      });

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
      patents,
      patentCount: totalCount,
      ntisProjects,
      marketData,
      policies,
      analysis,
      sources,
      messages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
    }
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
