import { Router } from "express";
import { db, usersTable, videosTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { verifySOLTransfer, verifyEditorPayment } from "../lib/solana.js";
import { PLAN_PRICES_LAMPORTS } from "../lib/planLimits.js";
import { logAction } from "../lib/logger.js";

const router = Router();

// ── POST /api/payments/verify-plan ──────────────────────────────────────────
// Called by frontend after a successful Solana payment.
// Verifies the on-chain transaction and activates the creator's plan.
router.post("/verify-plan", requireAuth, async (req, res) => {
  const { txSignature, plan, walletAddress } = req.body as {
    txSignature?: string;
    plan?: string;
    walletAddress?: string;
  };

  if (!txSignature || !plan || !walletAddress) {
    res.status(400).json({ error: "txSignature, plan, and walletAddress are required" });
    return;
  }

  if (plan !== "starter" && plan !== "pro") {
    res.status(400).json({ error: "Invalid plan — must be 'starter' or 'pro'" });
    return;
  }

  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS;
  if (!platformWallet) {
    res.status(500).json({ error: "Platform wallet not configured" });
    return;
  }

  // Prevent replay attacks — check signature not already used
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.planTxSignature, txSignature))
    .limit(1);

  if (existing) {
    res.status(400).json({ error: "Transaction already used to activate a plan" });
    return;
  }

  const expectedLamports = PLAN_PRICES_LAMPORTS[plan];

  const result = await verifySOLTransfer(txSignature, platformWallet, expectedLamports);
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }

  const now = new Date();
  await db
    .update(usersTable)
    .set({
      plan,
      planActivatedAt: now,
      planTxSignature: txSignature,
      planExpiresAt: null, // lifetime — no expiry
    })
    .where(eq(usersTable.id, req.user!.userId));

  await logAction(req.user!.userId, "plan_activated", undefined, {
    plan,
    txSignature,
    walletAddress,
  });

  res.json({ success: true, plan, activatedAt: now });
});

// ── POST /api/payments/pay-editor/:videoId ───────────────────────────────────
// Creator records an on-chain SOL payment to an editor for a specific video.
// The actual SOL transfer happens on the frontend; this route verifies + records it.
router.post("/pay-editor/:videoId", requireAuth, requireRole("creator"), async (req, res) => {
  const { videoId } = req.params as { videoId: string };
  const { txSignature, bountyLamports } = req.body as {
    txSignature?: string;
    bountyLamports?: number;
  };

  if (!txSignature || !bountyLamports) {
    res.status(400).json({ error: "txSignature and bountyLamports are required" });
    return;
  }

  // Load video and verify ownership
  const [video] = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.id, videoId))
    .limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  if (video.creatorId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (video.status !== "approved" && video.status !== "uploaded") {
    res.status(400).json({ error: "Video must be approved before paying the editor" });
    return;
  }

  // Load editor's wallet address
  const [editor] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, solanaWalletAddress: usersTable.solanaWalletAddress })
    .from(usersTable)
    .where(eq(usersTable.id, video.editorId))
    .limit(1);

  if (!editor?.solanaWalletAddress) {
    res.status(400).json({ error: "Editor has not set up a Solana wallet address. Ask them to add it in their profile." });
    return;
  }

  // Verify the on-chain transaction
  const result = await verifyEditorPayment(txSignature, editor.solanaWalletAddress, bountyLamports);
  if (!result.valid) {
    res.status(400).json({ error: result.error });
    return;
  }

  // Record payment in DB
  await db
    .update(videosTable)
    .set({
      editorBountyLamports: bountyLamports,
      editorPaymentTxSig: txSignature,
      editorPaymentStatus: "paid",
      updatedAt: new Date(),
    })
    .where(eq(videosTable.id, videoId));

  // Notify editor
  const solAmount = (bountyLamports / 1_000_000_000).toFixed(4);
  await db.insert(notificationsTable).values({
    userId: video.editorId,
    title: "Payment received!",
    message: `You received ${solAmount} SOL for "${video.title}". View on Solana Explorer: https://explorer.solana.com/tx/${txSignature}`,
    type: "payment_received",
    videoId: video.id,
  });

  await logAction(req.user!.userId, "editor_payment_sent", videoId, {
    txSignature,
    bountyLamports,
    editorWallet: editor.solanaWalletAddress,
  });

  res.json({
    success: true,
    txSignature,
    bountyLamports,
    solAmount,
    editorName: editor.name,
  });
});

// ── GET /api/payments/plan ────────────────────────────────────────────────────
// Returns the current user's plan info
router.get("/plan", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      plan: usersTable.plan,
      planActivatedAt: usersTable.planActivatedAt,
      planExpiresAt: usersTable.planExpiresAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  res.json({
    plan: user?.plan ?? "free",
    planActivatedAt: user?.planActivatedAt ?? null,
    planExpiresAt: user?.planExpiresAt ?? null,
  });
});

export default router;
