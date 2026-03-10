import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendTrackLink } from "@/lib/email";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

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
  if (!Array.isArray(team_member_ids) || team_member_ids.length === 0) {
    return NextResponse.json({ error: "No employees selected" }, { status: 400 });
  }

  // Verify track belongs to user
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  const { data: track, error: trackError } = await adminAny
    .from("tracks")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Fetch selected team members
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("id, name, email")
    .in("id", team_member_ids as string[])
    .eq("user_id", user.id);

  if (membersError || !members || members.length === 0) {
    return NextResponse.json({ error: "No valid team members found" }, { status: 400 });
  }

  // Fetch sender name
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email")
    .eq("id", user.id)
    .single();

  const senderName =
    (profile as { business_name: string | null; email: string } | null)?.business_name ||
    (profile as { business_name: string | null; email: string } | null)?.email?.split("@")[0] ||
    "Your Manager";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const results: { memberId: string; email: string; success: boolean; error?: string }[] = [];

  for (const member of members as { id: string; name: string; email: string }[]) {
    const token = nanoid(32);

    // Upsert track_assignment (re-send updates the token)
    const { data: existing } = await adminAny
      .from("track_assignments")
      .select("id")
      .eq("track_id", id)
      .eq("employee_email", member.email)
      .single();

    if (existing) {
      const { error: updateError } = await adminAny
        .from("track_assignments")
        .update({ unique_token: token, assigned_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (updateError) {
        results.push({ memberId: member.id, email: member.email, success: false, error: updateError.message });
        continue;
      }
    } else {
      const { error: insertError } = await adminAny
        .from("track_assignments")
        .insert({
          track_id: id,
          employee_email: member.email,
          employee_name: member.name,
          unique_token: token,
          assigned_at: new Date().toISOString(),
        });

      if (insertError) {
        results.push({ memberId: member.id, email: member.email, success: false, error: insertError.message });
        continue;
      }
    }

    if (send_email) {
      const trackLink = `${appUrl}/t/${token}`;
      try {
        await sendTrackLink({
          to: member.email,
          employeeName: member.name,
          trackTitle: (track as { title: string }).title,
          trackLink,
          senderName,
        });
        results.push({ memberId: member.id, email: member.email, success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ memberId: member.id, email: member.email, success: false, error: msg });
      }
    } else {
      results.push({ memberId: member.id, email: member.email, success: true });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.length - successCount;

  if (send_email && successCount === 0 && failedCount > 0) {
    const firstError = results.find((r) => r.error)?.error || "Email delivery failed";
    return NextResponse.json(
      { error: firstError, sent: 0, total: results.length, results },
      { status: 500 }
    );
  }

  return NextResponse.json({ sent: successCount, total: results.length, results });
}
