import { NextResponse } from "next/server";
import { searchPatents } from "@/lib/api/kipris";
import { getMarketData } from "@/lib/api/kosis";
import { getEnvStatus } from "@/lib/api/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    KIPRIS_API_KEY: getEnvStatus("KIPRIS_API_KEY"),
    KOSIS_API_KEY: getEnvStatus("KOSIS_API_KEY"),
    OPENROUTER_API_KEY: getEnvStatus("OPENROUTER_API_KEY"),
  };

  const query = "AI CCTV";

  const [patents, market] = await Promise.all([
    searchPatents(query),
    getMarketData(query),
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
    },
  });
}
