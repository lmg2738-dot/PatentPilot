import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePatentDraft } from "@/lib/api/openai";

const draftSchema = z.object({
  idea: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea } = draftSchema.parse(body);

    const draft = await generatePatentDraft(idea);

    return NextResponse.json({ draft });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "특허 초안 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
