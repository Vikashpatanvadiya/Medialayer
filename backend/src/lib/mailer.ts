import nodemailer from "nodemailer";

// Brevo (Sendinblue) HTTP API — works on Render free tier (no SMTP port blocking)
async function sendViaBrevoApi(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const from = { name: "MediaLayer", email: process.env.SMTP_FROM_EMAIL || "noreply@medialayer.app" };
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error: ${err}`);
  }
  return true;
}

// Resend HTTP API fallback
async function sendViaResendApi(to: string, subject: string, html: string): Promise<boolean> {
  // Support both RESEND_API_KEY and SMTP_PASS (Resend uses same key for SMTP and HTTP API)
  const apiKey = process.env.RESEND_API_KEY || (process.env.SMTP_HOST?.includes("resend") ? process.env.SMTP_PASS : undefined);
  if (!apiKey) return false;

  const from = process.env.SMTP_FROM || "MediaLayer <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[mailer] Resend API error response:", err);
    throw new Error(`Resend API error: ${err}`);
  }
  console.log("[mailer] Resend API: email sent to", to);
  return true;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Try Brevo HTTP API first
    if (process.env.BREVO_API_KEY) {
      console.log("[mailer] Using Brevo API");
      await sendViaBrevoApi(to, subject, html);
      return;
    }
    // Try Resend HTTP API (also works with SMTP_PASS when SMTP_HOST is resend)
    const resendKey = process.env.RESEND_API_KEY || (process.env.SMTP_HOST?.includes("resend") ? process.env.SMTP_PASS : undefined);
    if (resendKey) {
      console.log("[mailer] Using Resend API, from:", process.env.SMTP_FROM || "MediaLayer <onboarding@resend.dev>");
      await sendViaResendApi(to, subject, html);
      return;
    }
    // No email provider configured
    console.warn("[mailer] No email provider configured. BREVO_API_KEY:", !!process.env.BREVO_API_KEY, "RESEND_API_KEY:", !!process.env.RESEND_API_KEY, "SMTP_HOST:", process.env.SMTP_HOST, "SMTP_PASS set:", !!process.env.SMTP_PASS);
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}

// Email templates
export const emailTemplates = {
  videoSubmitted: (editorName: string, title: string) => ({
    subject: `New video awaiting your review: "${title}"`,
    html: `<p>Hi,</p><p><b>${editorName}</b> submitted <b>"${title}"</b> for your review on MediaLayer.</p><p>Log in to approve or reject it.</p>`,
  }),

  videoApproved: (creatorName: string, title: string) => ({
    subject: `Your video "${title}" was approved!`,
    html: `<p>Hi,</p><p><b>${creatorName}</b> approved your video <b>"${title}"</b>. It's ready to be uploaded to YouTube.</p>`,
  }),

  videoRejected: (creatorName: string, title: string, feedback: string) => ({
    subject: `Changes requested for "${title}"`,
    html: `<p>Hi,</p><p><b>${creatorName}</b> requested changes to <b>"${title}"</b>.</p><p><b>Feedback:</b> ${feedback}</p>`,
  }),

  videoUploaded: (title: string, youtubeUrl: string) => ({
    subject: `"${title}" is live on YouTube!`,
    html: `<p>Hi,</p><p>Your video <b>"${title}"</b> has been uploaded to YouTube.</p><p><a href="${youtubeUrl}">View on YouTube →</a></p>`,
  }),
};
