import nodemailer from "nodemailer";

// Resend HTTP API — more reliable than SMTP on Render free tier
async function sendViaResendApi(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
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
    throw new Error(`Resend API error: ${err}`);
  }
  return true;
}

// SMTP fallback (Gmail, etc.)
function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Try Resend HTTP API first (works on Render free tier)
    if (process.env.RESEND_API_KEY) {
      await sendViaResendApi(to, subject, html);
      return;
    }

    // Fallback to SMTP
    const transport = createTransport();
    if (!transport) return;
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
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
