import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPatents } from "@/lib/api/kipris";

const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const { query: validatedQuery } = searchSchema.parse({ query });

    const result = await searchPatents(validatedQuery);

    return NextResponse.json({
      patents: result.data.patents,
      count: result.data.patents.length,
      totalCount: result.data.totalCount,
      source: result.source,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 검색어입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "특허 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
