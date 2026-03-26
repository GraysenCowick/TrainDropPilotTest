import { NextRequest, NextResponse } from "next/server";
import { runModuleAnalysis } from "@/lib/video/pipeline";

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Internal endpoint — only callable with the service role key
  const internalKey = request.headers.get("x-internal-key");
  if (internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await runModuleAnalysis(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[run-analysis] ${id} failed:`, reason);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
