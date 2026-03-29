import { Router } from "express";
import { sendEmail } from "../lib/mailer.js";

const router = Router();

router.post("/pricing-feedback", async (req, res) => {
  const { price } = req.body as { price: string };
  if (!price) { res.status(400).json({ error: "Price is required" }); return; }

  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_FROM_EMAIL || "patanvadiyabansi6@gmail.com";

  sendEmail(ownerEmail, `💰 New pricing feedback: $${price}`, `
    <p>Someone submitted pricing feedback on MediaLayer.</p>
    <p><strong>Suggested price: $${price}</strong></p>
    <p>Time: ${new Date().toISOString()}</p>
  `).catch(() => {});

  res.json({ success: true });
});

export default router;
