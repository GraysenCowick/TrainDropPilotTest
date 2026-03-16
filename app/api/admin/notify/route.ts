import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "graysencowick67@gmail.com";
const resend = new Resend(process.env.RESEND_API_KEY);

interface AdminEvent {
  id: string;
  table_name: string;
  event_type: string;
  description: string;
  priority: string;
  created_at: string;
  payload: Record<string, unknown>;
}

function eventEmoji(eventType: string) {
  if (eventType === "INSERT") return "🟢";
  if (eventType === "UPDATE") return "🟡";
  if (eventType === "DELETE") return "🔴";
  return "⚪";
}

async function sendImmediateEmail(event: AdminEvent) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const emoji = eventEmoji(event.event_type);
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://traindrop.app"}/admin`;

  await resend.emails.send({
    from,
    to: ADMIN_EMAIL,
    subject: `${emoji} TrainDrop: ${event.description}`,
    html: buildEmailHtml({
      title: event.description,
      events: [event],
      adminUrl,
      isBatch: false,
    }),
  });
}

function buildEmailHtml({
  title,
  events,
  adminUrl,
  isBatch,
}: {
  title: string;
  events: AdminEvent[];
  adminUrl: string;
  isBatch: boolean;
}) {
  const eventRows = events
    .map(
      (e) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1f1f23;vertical-align:top;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span style="font-size:11px;font-family:monospace;padding:2px 6px;border-radius:4px;background:${
            e.event_type === "INSERT"
              ? "#14532d"
              : e.event_type === "UPDATE"
              ? "#422006"
              : "#450a0a"
          };color:${
            e.event_type === "INSERT"
              ? "#4ade80"
              : e.event_type === "UPDATE"
              ? "#fbbf24"
              : "#f87171"
          };white-space:nowrap;">${e.event_type}</span>
          <div>
            <div style="color:#e4e4e7;font-size:13px;">${e.description}</div>
            <div style="color:#52525b;font-size:11px;margin-top:2px;">${e.table_name} · ${new Date(e.created_at).toLocaleTimeString()}</div>
          </div>
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
              <span style="color:#fff;font-weight:700;font-size:14px;">TrainDrop Admin</span>
              ${isBatch ? `<span style="background:#27272a;color:#a1a1aa;font-size:11px;padding:2px 8px;border-radius:9999px;">${events.length} events</span>` : ""}
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;">
            <h2 style="color:#f4f4f5;font-size:16px;font-weight:600;margin:0 0 16px;">${title}</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${eventRows}
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
            <p style="color:#3f3f46;font-size:11px;margin:0;">TrainDrop platform alerts</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  // Validate webhook secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.ADMIN_WEBHOOK_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { record?: AdminEvent };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const event = body.record;
  if (!event) {
    return new Response("OK", { status: 200 });
  }

  // High-priority events get an immediate email
  if (event.priority === "high") {
    try {
      await sendImmediateEmail(event);

      // Mark as emailed
      const admin = await createAdminClient();
      await (admin as any)
        .from("admin_event_log")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", event.id);
    } catch (err) {
      console.error("[admin/notify] Failed to send email:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
