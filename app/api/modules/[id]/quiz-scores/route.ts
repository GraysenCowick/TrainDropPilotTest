import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: moduleId } = await params;
  const admin = (await createAdminClient()) as any;

  // Verify ownership
  const { data: module } = await admin
    .from("modules")
    .select("user_id")
    .eq("id", moduleId)
    .single();

  if (!module || module.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all completions for this module with quiz responses
  const { data: completions, error } = await admin
    .from("module_completions")
    .select(`
      id,
      sent_at,
      completed_at,
      team_members ( name, email ),
      quiz_responses (
        id,
        selected_answer,
        is_correct,
        answered_at,
        question_id
      )
    `)
    .eq("module_id", moduleId)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all quiz questions with full detail for the drill-down view
  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, chapter_index, question, options, correct_answer, explanation, sort_order")
    .eq("module_id", moduleId)
    .order("chapter_index")
    .order("sort_order");

  const totalQuestions = questions?.length ?? 0;

  // Build a lookup map: question_id → question details
  const questionMap: Record<string, any> = {};
  (questions || []).forEach((q: any) => { questionMap[q.id] = q; });

  const result = (completions || []).map((c: any) => {
    const responses = c.quiz_responses || [];
    const correct = responses.filter((r: any) => r.is_correct).length;
    const attempted = responses.length;
    const score = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

    // Build per-question detail sorted by chapter then sort_order
    const responseDetail = responses
      .map((r: any) => {
        const q = questionMap[r.question_id];
        if (!q) return null;
        return {
          question_id: r.question_id,
          chapter_index: q.chapter_index,
          sort_order: q.sort_order,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          selected_answer: r.selected_answer,
          is_correct: r.is_correct,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) =>
        a.chapter_index !== b.chapter_index
          ? a.chapter_index - b.chapter_index
          : a.sort_order - b.sort_order
      );

    return {
      completion_id: c.id,
      employee_name: c.team_members?.name ?? "Unknown",
      employee_email: c.team_members?.email ?? null,
      sent_at: c.sent_at,
      completed_at: c.completed_at,
      quiz_score: score,
      quiz_correct: correct,
      quiz_attempted: attempted,
      quiz_total: totalQuestions,
      responses: responseDetail,
    };
  });

  return NextResponse.json(result);
}
