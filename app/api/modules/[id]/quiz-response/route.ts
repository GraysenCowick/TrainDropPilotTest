import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: moduleId } = await params;
  const body = await request.json();
  const { module_completion_id, responses } = body;
  // responses: Array<{ question_id: string; selected_answer: number; is_correct: boolean }>

  if (!module_completion_id || !Array.isArray(responses)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = (await createAdminClient()) as any;

  // Upsert responses (idempotent — employee can retake)
  const rows = responses.map((r: { question_id: string; selected_answer: number; is_correct: boolean }) => ({
    module_completion_id,
    question_id: r.question_id,
    selected_answer: r.selected_answer,
    is_correct: r.is_correct,
  }));

  const { error } = await admin
    .from("quiz_responses")
    .upsert(rows, { onConflict: "module_completion_id,question_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate score
  const correct = responses.filter((r: { is_correct: boolean }) => r.is_correct).length;
  const total = responses.length;
  const score = Math.round((correct / total) * 100);

  return NextResponse.json({ ok: true, score, correct, total });
}
