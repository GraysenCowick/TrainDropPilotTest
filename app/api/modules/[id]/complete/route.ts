import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { employee_name, employee_email, unique_token, time_spent_seconds } = body;

  if (!employee_name?.trim()) {
    return NextResponse.json({ error: "employee_name is required" }, { status: 400 });
  }

  // Verify module exists and is published
  const { data: rawModule } = await supabase
    .from("modules")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!rawModule) {
    return NextResponse.json({ error: "Module not found or not published" }, { status: 404 });
  }

  const moduleRow = rawModule as { id: string; status: string; user_id: string };
  const now = new Date().toISOString();
  const adminSupabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = adminSupabase as any;

  if (unique_token) {
    // Token path: update the existing module_completions row
    const { error: updateError } = await adminAny
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
    // Share-link path: find or create a team member, then upsert module_completions
    const email = employee_email.trim().toLowerCase();

    const { data: existingMember } = await adminAny
      .from("team_members")
      .select("id")
      .eq("email", email)
      .eq("user_id", moduleRow.user_id)
      .single();

    let teamMemberId: string | null = existingMember?.id ?? null;

    if (!teamMemberId) {
      const { data: newMember, error: insertMemberError } = await adminAny
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

    const { data: existingCompletion } = await adminAny
      .from("module_completions")
      .select("id")
      .eq("module_id", id)
      .eq("team_member_id", teamMemberId)
      .single();

    if (existingCompletion) {
      await adminAny
        .from("module_completions")
        .update({
          completed_at: now,
          time_spent_seconds: typeof time_spent_seconds === "number" ? time_spent_seconds : null,
        })
        .eq("id", existingCompletion.id);
    } else {
      const { error: insertError } = await adminAny
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

  return NextResponse.json({ completed_at: now }, { status: 201 });
}
