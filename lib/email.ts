import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendModuleLinkParams {
  to: string;
  employeeName: string;
  moduleTitle: string;
  moduleLink: string;
  senderName?: string;
}

export async function sendModuleLink({
  to,
  employeeName,
  moduleTitle,
  moduleLink,
  senderName,
}: SendModuleLinkParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const sender = senderName || "Your Manager";

  if (!apiKey || apiKey === "re_your_resend_api_key_here") {
    throw new Error("RESEND_API_KEY is not configured in .env.local");
  }

  console.log(`[email] Sending to: ${to} | from: ${from} | module: "${moduleTitle}"`);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:#00cfff;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#0a0a0a;font-weight:bold;font-size:13px;">TD</span>
                </div>
                <span style="color:#fff;font-weight:700;font-size:16px;">TrainDrop</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:32px;">
              <p style="color:#a0a0a0;font-size:14px;margin:0 0 8px;">Hi ${employeeName},</p>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">
                You have a new training module
              </h1>
              <p style="color:#a0a0a0;font-size:14px;margin:0 0 24px;line-height:1.6;">
                ${sender} has assigned you a training module to complete:
              </p>

              <!-- Module card -->
              <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#00cfff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Training Module</p>
                <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;">${moduleTitle}</p>
              </div>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${moduleLink}"
                       style="display:inline-block;background:#00cfff;color:#0a0a0a;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Start Training →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#606060;font-size:12px;margin:24px 0 0;text-align:center;">
                Or paste this link in your browser:<br>
                <a href="${moduleLink}" style="color:#00cfff;word-break:break-all;">${moduleLink}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#404040;font-size:12px;margin:0;">
                Powered by TrainDrop · <a href="https://traindrop.app" style="color:#404040;">traindrop.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Training assigned: ${moduleTitle}`,
    html,
  });

  if (error) {
    console.error(`[email] Resend error for ${to}:`, JSON.stringify(error));
    throw new Error(error.message || "Resend returned an error");
  }

  console.log(`[email] Sent successfully to ${to} | id: ${data?.id}`);
  return data;
}

interface SendTrackLinkParams {
  to: string;
  employeeName: string;
  trackTitle: string;
  trackLink: string;
  senderName?: string;
}

export async function sendTrackLink({
  to,
  employeeName,
  trackTitle,
  trackLink,
  senderName,
}: SendTrackLinkParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const sender = senderName || "Your Manager";

  if (!apiKey || apiKey === "re_your_resend_api_key_here") {
    throw new Error("RESEND_API_KEY is not configured in .env.local");
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#07090f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:#00cfff;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#07090f;font-weight:bold;font-size:13px;">TD</span>
                </div>
                <span style="color:#eef2f9;font-weight:700;font-size:16px;">TrainDrop</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f1220;border:1px solid #1a2035;border-radius:16px;padding:32px;">
              <p style="color:#7a85a0;font-size:14px;margin:0 0 8px;">Hi ${employeeName},</p>
              <h1 style="color:#eef2f9;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">
                You have a new training track
              </h1>
              <p style="color:#7a85a0;font-size:14px;margin:0 0 24px;line-height:1.6;">
                ${sender} has assigned you a training track to complete:
              </p>

              <!-- Track card -->
              <div style="background:#07090f;border:1px solid #1a2035;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#00cfff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Training Track</p>
                <p style="color:#eef2f9;font-size:16px;font-weight:600;margin:0;">${trackTitle}</p>
              </div>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${trackLink}"
                       style="display:inline-block;background:#00cfff;color:#07090f;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Start Training →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#7a85a0;font-size:12px;margin:24px 0 0;text-align:center;">
                Or paste this link in your browser:<br>
                <a href="${trackLink}" style="color:#00cfff;word-break:break-all;">${trackLink}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#1a2035;font-size:12px;margin:0;">
                Powered by TrainDrop · <a href="https://traindrop.app" style="color:#1a2035;">traindrop.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Training track assigned: ${trackTitle}`,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend returned an error");
  }

  return data;
}
