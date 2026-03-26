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

  // Get all quiz questions for score calculation
  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, chapter_index")
    .eq("module_id", moduleId);

  const totalQuestions = questions?.length ?? 0;

  const result = (completions || []).map((c: any) => {
    const responses = c.quiz_responses || [];
    const correct = responses.filter((r: any) => r.is_correct).length;
    const attempted = responses.length;
    const score = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

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
    };
  });

  return NextResponse.json(result);
}
