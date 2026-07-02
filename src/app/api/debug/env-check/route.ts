import { NextResponse } from "next/server";
import { searchPatents } from "@/lib/api/kipris";
import { getMarketData, getPolicyInfo } from "@/lib/api/kosis";
import { searchNtisProjects } from "@/lib/api/ntis";
import { getEnvStatus } from "@/lib/api/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    KIPRIS_API_KEY: getEnvStatus("KIPRIS_API_KEY"),
    KOSIS_API_KEY: getEnvStatus("KOSIS_API_KEY"),
    OPENROUTER_API_KEY: getEnvStatus("OPENROUTER_API_KEY"),
    NTIS_API_KEY: getEnvStatus("NTIS_API_KEY"),
    POLICY_API_KEY: getEnvStatus("POLICY_API_KEY"),
  };

  const query = "AI CCTV";

  const [patents, market, ntis, policies] = await Promise.all([
    searchPatents(query),
    getMarketData(query),
    searchNtisProjects(query),
    getPolicyInfo(query),
  ]);

  return NextResponse.json({
    env,
    runtime: process.env.VERCEL ? "vercel" : "local",
    region: process.env.VERCEL_REGION ?? "unknown",
    tests: {
      kipris: {
        source: patents.source,
        message: patents.message,
        totalCount: patents.data.totalCount,
      },
      kosis: {
        source: market.source,
        message: market.message,
        rows: market.data.length,
      },
      ntis: {
        source: ntis.source,
        message: ntis.message,
        rows: ntis.data.length,
      },
      policies: {
        source: policies.source,
        message: policies.message,
        rows: policies.data.length,
      },
    },
  });
}
