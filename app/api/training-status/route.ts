import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = (await createAdminClient()) as any;

  // Get all modules belonging to this user
  const { data: modules } = await admin
    .from("modules")
    .select("id, title")
    .eq("user_id", user.id);

  if (!modules || modules.length === 0) return NextResponse.json([]);

  const moduleIds = (modules as { id: string; title: string }[]).map((m) => m.id);
  const moduleMap: Record<string, string> = {};
  (modules as { id: string; title: string }[]).forEach((m) => { moduleMap[m.id] = m.title; });

  // Get all completions with team member info and quiz responses
  const { data: completions, error } = await admin
    .from("module_completions")
    .select(`
      id,
      module_id,
      sent_at,
      viewed_at,
      completed_at,
      team_members ( name, email ),
      quiz_responses ( is_correct )
    `)
    .in("module_id", moduleIds)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get quiz question counts per module
  const { data: questions } = await admin
    .from("quiz_questions")
    .select("module_id")
    .in("module_id", moduleIds);

  const questionCountByModule: Record<string, number> = {};
  (questions as { module_id: string }[] | null || []).forEach((q) => {
    questionCountByModule[q.module_id] = (questionCountByModule[q.module_id] || 0) + 1;
  });

  const result = (completions || []).map((c: any) => {
    const responses: { is_correct: boolean }[] = c.quiz_responses || [];
    const attempted = responses.length;
    const correct = responses.filter((r) => r.is_correct).length;
    const quizTotal = questionCountByModule[c.module_id] ?? 0;
    const quizScore = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

    let status: "pending" | "in_progress" | "completed";
    if (c.completed_at) status = "completed";
    else if (c.viewed_at) status = "in_progress";
    else status = "pending";

    return {
      completion_id: c.id,
      module_id: c.module_id,
      module_title: moduleMap[c.module_id] ?? "Unknown",
      employee_name: c.team_members?.name ?? "Unknown",
      employee_email: c.team_members?.email ?? null,
      status,
      sent_at: c.sent_at,
      viewed_at: c.viewed_at,
      completed_at: c.completed_at,
      quiz_score: quizScore,
      quiz_correct: correct,
      quiz_total: quizTotal,
    };
  });

  return NextResponse.json(result);
}
