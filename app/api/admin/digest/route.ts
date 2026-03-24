import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "graysencowick67@gmail.com";
const resend = new Resend(process.env.RESEND_API_KEY);

interface AdminEvent {
  id: string;
  table_name: string;
  event_type: string;
  description: string;
  priority: string;
  created_at: string;
}

function eventEmoji(eventType: string) {
  if (eventType === "INSERT") return "🟢";
  if (eventType === "UPDATE") return "🟡";
  if (eventType === "DELETE") return "🔴";
  return "⚪";
}

function buildDigestHtml(events: AdminEvent[], adminUrl: string) {
  const rows = events
    .map(
      (e) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1f1f23;vertical-align:top;">
        <span style="font-size:11px;font-family:monospace;padding:2px 6px;border-radius:4px;
          background:${e.event_type === "INSERT" ? "#14532d" : e.event_type === "UPDATE" ? "#422006" : "#450a0a"};
          color:${e.event_type === "INSERT" ? "#4ade80" : e.event_type === "UPDATE" ? "#fbbf24" : "#f87171"};">
          ${e.event_type}
        </span>
        &nbsp;
        <span style="color:#e4e4e7;font-size:13px;">${e.description}</span>
        <div style="color:#52525b;font-size:11px;margin-top:2px;padding-left:2px;">
          ${e.table_name} · ${new Date(e.created_at).toLocaleString()}
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding-bottom:24px;">
            <div style="display:inline-flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;background:#22d3ee;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;">
                <span style="color:#09090b;font-weight:bold;font-size:11px;">TD</span>
              </div>
              <span style="color:#fff;font-weight:700;font-size:14px;">TrainDrop Activity Digest</span>
              <span style="background:#27272a;color:#a1a1aa;font-size:11px;padding:2px 8px;border-radius:9999px;">
                ${events.length} event${events.length !== 1 ? "s" : ""}
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;">
            <h2 style="color:#f4f4f5;font-size:15px;font-weight:600;margin:0 0 16px;">
              ${events.length} new event${events.length !== 1 ? "s" : ""} in the last 5 minutes
            </h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rows}
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="${adminUrl}" style="display:inline-block;background:#22d3ee;color:#09090b;font-weight:700;font-size:13px;text-decoration:none;padding:10px 24px;border-radius:8px;">
                Open Admin Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;text-align:center;">
            <p style="color:#3f3f46;font-size:11px;margin:0;">TrainDrop 5-minute digest</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Called by Vercel cron every 5 minutes
export async function GET(request: Request) {
  // Verify cron secret (Vercel adds this automatically in production)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = await createAdminClient();

  // Fetch all normal-priority events not yet emailed
  const { data: events, error } = await (admin as any)
    .from("admin_event_log")
    .select("*")
    .is("emailed_at", null)
    .eq("priority", "normal")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin/digest] Query error:", error);
    return new Response("Error", { status: 500 });
  }

  if (!events || events.length === 0) {
    return new Response("No pending events", { status: 200 });
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://traindrop.app"}/admin`;
  const firstEmoji = eventEmoji(events[0].event_type);
  const subject =
    events.length === 1
      ? `${firstEmoji} TrainDrop: ${events[0].description}`
      : `🟢 TrainDrop: ${events.length} new events in the last 5 minutes`;

  try {
    await resend.emails.send({
      from,
      to: ADMIN_EMAIL,
      subject,
      html: buildDigestHtml(events, adminUrl),
    });
  } catch (err) {
    console.error("[admin/digest] Resend error:", err);
    return new Response("Email send failed", { status: 500 });
  }

  // Mark all as emailed
  const ids = (events as AdminEvent[]).map((e) => e.id);
  await (admin as any)
    .from("admin_event_log")
    .update({ emailed_at: new Date().toISOString() })
    .in("id", ids);

  return new Response(`Digest sent for ${events.length} events`, {
    status: 200,
  });
}
