import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendModuleLink } from "@/lib/email";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  console.log(`[send] POST /api/modules/${id}/send`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { team_member_ids?: unknown; send_email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { team_member_ids, send_email } = body;
  console.log(`[send] body: team_member_ids=${JSON.stringify(team_member_ids)} send_email=${send_email}`);

  if (!Array.isArray(team_member_ids) || team_member_ids.length === 0) {
    return NextResponse.json({ error: "No employees selected" }, { status: 400 });
  }

  // Verify module belongs to user and is published
  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("id, title, share_slug, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (moduleError || !module) {
    console.error("[send] Module not found:", moduleError?.message);
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  if (module.status !== "published" || !module.share_slug) {
    return NextResponse.json({ error: "Module must be published before sending" }, { status: 400 });
  }

  console.log(`[send] Module: "${module.title}" slug=${module.share_slug}`);

  // Fetch selected team members
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("id, name, email")
    .in("id", team_member_ids as string[])
    .eq("user_id", user.id);

  if (membersError || !members || members.length === 0) {
    console.error("[send] No valid team members:", membersError?.message);
    return NextResponse.json({ error: "No valid team members found" }, { status: 400 });
  }

  console.log(`[send] Sending to ${members.length} member(s): ${(members as {name:string;email:string}[]).map(m => m.email).join(", ")}`);

  // Fetch sender name
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email")
    .eq("id", user.id)
    .single();

  const senderName = (profile as { business_name: string | null; email: string } | null)?.business_name
    || (profile as { business_name: string | null; email: string } | null)?.email?.split("@")[0]
    || "Your Manager";

  // Derive the base URL from the request so links always point back to the
  // same deployment that created the module_completions token — not a hardcoded domain.
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const appUrl = `${proto}://${host}`;
  const adminSupabase = await createAdminClient();

  const results: { memberId: string; email: string; success: boolean; error?: string; token?: string }[] = [];

  for (const member of members as { id: string; name: string; email: string }[]) {
    const token = nanoid(32);
    console.log(`[send] Processing member: ${member.email} (id: ${member.id})`);

    // Check if a completion row already exists to avoid resetting progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (adminSupabase as any)
      .from("module_completions")
      .select("id")
      .eq("module_id", id)
      .eq("team_member_id", member.id)
      .single();

    if (existing) {
      // Re-send: only update the token + sent_at, preserve completion data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (adminSupabase as any)
        .from("module_completions")
        .update({ unique_token: token, sent_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (updateError) {
        console.error(`[send] Failed to update completion row for ${member.email}:`, updateError.message);
        results.push({ memberId: member.id, email: member.email, success: false, error: updateError.message });
        continue;
      }
    } else {
      // First send: create a new row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (adminSupabase as any)
        .from("module_completions")
        .insert({
          module_id: id,
          team_member_id: member.id,
          unique_token: token,
          sent_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`[send] Failed to insert completion row for ${member.email}:`, insertError.message);
        results.push({ memberId: member.id, email: member.email, success: false, error: insertError.message });
        continue;
      }
    }

    if (send_email) {
      const moduleLink = `${appUrl}/m/${module.share_slug}?token=${token}`;
      console.log(`[send] Calling sendModuleLink → ${moduleLink}`);
      try {
        await sendModuleLink({
          to: member.email,
          employeeName: member.name,
          moduleTitle: module.title,
          moduleLink,
          senderName,
        });
        console.log(`[send] ✓ Email sent to ${member.email}`);
        results.push({ memberId: member.id, email: member.email, success: true, token });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[send] ✗ Email failed for ${member.email}:`, msg);
        results.push({ memberId: member.id, email: member.email, success: false, error: msg, token });
      }
    } else {
      results.push({ memberId: member.id, email: member.email, success: true, token });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.length - successCount;
  console.log(`[send] Done. ${successCount} sent, ${failedCount} failed.`);

  // If every single email failed, return a 500 so the frontend can show an error
  if (send_email && successCount === 0 && failedCount > 0) {
    const firstError = results.find((r) => r.error)?.error || "Email delivery failed";
    return NextResponse.json(
      { error: firstError, sent: 0, total: results.length, results },
      { status: 500 }
    );
  }

  return NextResponse.json({ sent: successCount, total: results.length, results });
}
