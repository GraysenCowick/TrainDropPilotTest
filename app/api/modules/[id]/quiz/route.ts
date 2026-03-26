import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = (await createAdminClient()) as any;

  const { data, error } = await admin
    .from("quiz_questions")
    .select("*")
    .eq("module_id", id)
    .order("chapter_index", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// Manager can update a quiz question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { question_id, question, options, correct_answer, explanation } = body;

  const admin = (await createAdminClient()) as any;

  // Verify ownership
  const { data: q } = await admin
    .from("quiz_questions")
    .select("module_id, modules!inner(user_id)")
    .eq("id", question_id)
    .single();

  if (!q || (q.modules as any).user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("quiz_questions")
    .update({ question, options, correct_answer, explanation })
    .eq("id", question_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
