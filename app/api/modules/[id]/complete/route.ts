import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { employee_name, employee_email, unique_token, time_spent_seconds } = body;

  if (!employee_name?.trim()) {
    return NextResponse.json({ error: "employee_name is required" }, { status: 400 });
  }

  // Use admin client throughout — this endpoint is called by unauthenticated employees.
  // Regular createClient() with no session would be blocked by RLS on modules table.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const now = new Date().toISOString();

  // Verify module exists and is published
  const { data: moduleRow } = await admin
    .from("modules")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!moduleRow) {
    return NextResponse.json({ error: "Module not found or not published" }, { status: 404 });
  }

  if (unique_token) {
    // Token path: employee arrived via a sent link — update their existing row

    // Backend quiz validation: require all questions answered before completing
    const { data: tokenCompletion } = await admin
      .from("module_completions")
      .select("id")
      .eq("unique_token", unique_token)
      .eq("module_id", id)
      .single();

    if (tokenCompletion) {
      const { data: allQuestions } = await admin
        .from("quiz_questions")
        .select("id")
        .eq("module_id", id);

      if (allQuestions && allQuestions.length > 0) {
        const { data: responses } = await admin
          .from("quiz_responses")
          .select("question_id")
          .eq("module_completion_id", tokenCompletion.id);

        const answeredIds = new Set(
          (responses as { question_id: string }[] | null || []).map((r) => r.question_id)
        );
        const allAnswered = (allQuestions as { id: string }[]).every((q) => answeredIds.has(q.id));

        if (!allAnswered) {
          return NextResponse.json(
            { error: "All quiz and test questions must be answered before completing this module." },
            { status: 400 }
          );
        }
      }
    }

    const { error: updateError } = await admin
      .from("module_completions")
      .update({
        completed_at: now,
        time_spent_seconds: typeof time_spent_seconds === "number" ? time_spent_seconds : null,
      })
      .eq("unique_token", unique_token)
      .eq("module_id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else if (employee_email?.trim()) {
    // Public share-link path: find or create a team member, then upsert module_completions
    const email = employee_email.trim().toLowerCase();

    const { data: existingMember } = await admin
      .from("team_members")
      .select("id")
      .eq("email", email)
      .eq("user_id", moduleRow.user_id)
      .single();

    let teamMemberId: string | null = existingMember?.id ?? null;

    if (!teamMemberId) {
      const { data: newMember, error: insertMemberError } = await admin
        .from("team_members")
        .insert({ user_id: moduleRow.user_id, name: employee_name.trim(), email })
        .select("id")
        .single();
      if (insertMemberError) {
        return NextResponse.json({ error: insertMemberError.message }, { status: 500 });
      }
      teamMemberId = newMember?.id ?? null;
    }

    if (!teamMemberId) {
      return NextResponse.json({ error: "Failed to resolve team member" }, { status: 500 });
    }

    const { data: existingCompletion } = await admin
      .from("module_completions")
      .select("id")
      .eq("module_id", id)
      .eq("team_member_id", teamMemberId)
      .single();

    if (existingCompletion) {
      await admin
        .from("module_completions")
        .update({
          completed_at: now,
          time_spent_seconds: typeof time_spent_seconds === "number" ? time_spent_seconds : null,
        })
        .eq("id", existingCompletion.id);
    } else {
      const { error: insertError } = await admin
        .from("module_completions")
        .insert({
          module_id: id,
          team_member_id: teamMemberId,
          unique_token: nanoid(32),
          sent_at: now,
          completed_at: now,
          time_spent_seconds: typeof time_spent_seconds === "number" ? time_spent_seconds : null,
        });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  }

  // Fetch the completion row id so the employee page can submit quiz responses
  let completionId: string | null = null;
  if (unique_token) {
    const { data: completionRow } = await admin
      .from("module_completions")
      .select("id")
      .eq("unique_token", unique_token)
      .eq("module_id", id)
      .single();
    completionId = completionRow?.id ?? null;
  } else if (employee_email?.trim()) {
    const email = employee_email.trim().toLowerCase();
    const { data: completionRow } = await admin
      .from("module_completions")
      .select("id")
      .eq("module_id", id)
      .eq("team_member_id", (await admin
        .from("team_members")
        .select("id")
        .eq("email", email)
        .eq("user_id", moduleRow.user_id)
        .single()).data?.id ?? "")
      .single();
    completionId = completionRow?.id ?? null;
  }

  return NextResponse.json({ id: completionId, completed_at: now }, { status: 201 });
}
