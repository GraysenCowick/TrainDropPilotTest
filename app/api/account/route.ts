import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const uid = user.id;

  // Manually delete all user data in dependency order.
  // Required because DB FK constraints don't have ON DELETE CASCADE yet.

  // 1. Get user's module IDs and track IDs
  const { data: modules } = await admin.from("modules").select("id").eq("user_id", uid);
  const moduleIds: string[] = (modules || []).map((m: { id: string }) => m.id);

  const { data: tracks } = await admin.from("tracks").select("id").eq("user_id", uid);
  const trackIds: string[] = (tracks || []).map((t: { id: string }) => t.id);

  // 2. Delete track_module_completions (references track_assignments and modules)
  if (trackIds.length > 0) {
    const { data: assignments } = await admin
      .from("track_assignments")
      .select("id")
      .in("track_id", trackIds);
    const assignmentIds = (assignments || []).map((a: { id: string }) => a.id);
    if (assignmentIds.length > 0) {
      await admin.from("track_module_completions").delete().in("track_assignment_id", assignmentIds);
    }
  }
  if (moduleIds.length > 0) {
    await admin.from("track_module_completions").delete().in("module_id", moduleIds);
  }

  // 3. Delete track_assignments
  if (trackIds.length > 0) {
    await admin.from("track_assignments").delete().in("track_id", trackIds);
  }

  // 4. Delete track_modules
  if (trackIds.length > 0) {
    await admin.from("track_modules").delete().in("track_id", trackIds);
  }
  if (moduleIds.length > 0) {
    await admin.from("track_modules").delete().in("module_id", moduleIds);
  }

  // 5. Delete module_completions
  if (moduleIds.length > 0) {
    await admin.from("module_completions").delete().in("module_id", moduleIds);
  }

  // 6. Delete legacy assignments and completions
  if (moduleIds.length > 0) {
    await admin.from("assignments").delete().in("module_id", moduleIds);
    await admin.from("completions").delete().in("module_id", moduleIds);
  }
  await admin.from("assignments").delete().eq("user_id", uid);

  // 7. Delete tracks and modules
  if (trackIds.length > 0) {
    await admin.from("tracks").delete().in("id", trackIds);
  }
  if (moduleIds.length > 0) {
    await admin.from("modules").delete().in("id", moduleIds);
  }

  // 8. Delete team_members
  await admin.from("team_members").delete().eq("user_id", uid);

  // 9. Delete profile
  await admin.from("profiles").delete().eq("id", uid);

  // 10. Delete auth user
  const { error } = await admin.auth.admin.deleteUser(uid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
