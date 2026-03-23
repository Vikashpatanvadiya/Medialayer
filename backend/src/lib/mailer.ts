import nodemailer from "nodemailer";

// Uses SMTP env vars — works with Gmail, SendGrid, Resend, Mailtrap, etc.
// If no SMTP config, emails are skipped silently (non-blocking)
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
    const transport = createTransport();
    if (!transport) return; // silently skip if SMTP not configured

    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Non-blocking — email failures should never crash the request
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
