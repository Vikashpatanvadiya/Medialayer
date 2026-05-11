import { Router } from "express";
import { db, usersTable, videosTable, editorCreatorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/creators", requireAuth, async (_req, res) => {
  const creators = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.role, "creator"));
  res.json({ users: creators });
});

// Editor adds a creator via invite code
router.post("/link-creator", requireAuth, requireRole("editor"), async (req, res) => {
  const { inviteCode } = req.body as { inviteCode?: string };
  if (!inviteCode?.trim()) { res.status(400).json({ error: "Invite code is required" }); return; }

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.inviteCode, inviteCode.trim().toUpperCase())).limit(1);
  if (!creator || creator.role !== "creator") { res.status(404).json({ error: "Invalid invite code" }); return; }

  const [existing] = await db.select().from(editorCreatorsTable)
    .where(and(eq(editorCreatorsTable.editorId, req.user!.userId), eq(editorCreatorsTable.creatorId, creator.id)))
    .limit(1);
  if (existing) { res.status(400).json({ error: `You're already linked to ${creator.name}` }); return; }

  await db.insert(editorCreatorsTable).values({ editorId: req.user!.userId, creatorId: creator.id });
  res.json({ message: "Linked successfully", creatorId: creator.id, creatorName: creator.name });
});

// Editor unlinks a creator
router.delete("/unlink-creator/:creatorId", requireAuth, requireRole("editor"), async (req, res) => {
  await db.delete(editorCreatorsTable)
    .where(and(eq(editorCreatorsTable.editorId, req.user!.userId), eq(editorCreatorsTable.creatorId, req.params.creatorId)));
  res.json({ message: "Creator unlinked" });
});

// Editor gets their linked creators
router.get("/my-creators", requireAuth, requireRole("editor"), async (req, res) => {
  const links = await db.select().from(editorCreatorsTable).where(eq(editorCreatorsTable.editorId, req.user!.userId));
  if (links.length === 0) { res.json({ creators: [] }); return; }

  const creators = await Promise.all(
    links.map(async (link) => {
      const [creator] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(eq(usersTable.id, link.creatorId)).limit(1);
      return creator;
    })
  );
  res.json({ creators: creators.filter(Boolean) });
});

// Creator gets their invite code — generate one if missing
router.get("/invite-code", requireAuth, requireRole("creator"), async (req, res) => {
  const [user] = await db.select({ inviteCode: usersTable.inviteCode }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (user?.inviteCode) {
    res.json({ inviteCode: user.inviteCode });
    return;
  }

  // Generate invite code if missing (e.g. Google OAuth users)
  const newCode = Math.random().toString(36).substring(2, 6).toUpperCase() +
                  Math.random().toString(36).substring(2, 6).toUpperCase();
  await db.update(usersTable).set({ inviteCode: newCode }).where(eq(usersTable.id, req.user!.userId));
  res.json({ inviteCode: newCode });
});

// Creator gets their editors list
router.get("/my-editors", requireAuth, requireRole("creator"), async (req, res) => {
  const creatorId = req.user!.userId;
  const videos = await db.select().from(videosTable).where(eq(videosTable.creatorId, creatorId));
  const editorIds = [...new Set(videos.map((v) => v.editorId))];

  if (editorIds.length === 0) { res.json({ editors: [] }); return; }

  const editors = await Promise.all(
    editorIds.map(async (editorId) => {
      const [user] = await db
        .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(eq(usersTable.id, editorId)).limit(1);

      const editorVideos = videos.filter((v) => v.editorId === editorId);
      return {
        ...user,
        totalVideos: editorVideos.length,
        pendingVideos: editorVideos.filter((v) => v.status === "pending").length,
        approvedVideos: editorVideos.filter((v) => v.status === "approved").length,
        uploadedVideos: editorVideos.filter((v) => v.status === "uploaded").length,
        rejectedVideos: editorVideos.filter((v) => v.status === "rejected").length,
        lastSubmitted: editorVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? null,
      };
    })
  );
  res.json({ editors });
});

// Creator removes an editor
router.delete("/remove-editor/:editorId", requireAuth, requireRole("creator"), async (req, res) => {
  await db.delete(editorCreatorsTable)
    .where(and(eq(editorCreatorsTable.editorId, req.params.editorId), eq(editorCreatorsTable.creatorId, req.user!.userId)));
  res.json({ message: "Editor removed" });
});

// Save/update Solana wallet address for any user (editor or creator)
router.post("/wallet", requireAuth, async (req, res) => {
  const { walletAddress } = req.body as { walletAddress?: string };
  if (!walletAddress?.trim()) {
    res.status(400).json({ error: "walletAddress is required" });
    return;
  }

  // Solana addresses are base58-encoded 32-byte public keys — 32 to 44 chars
  const addr = walletAddress.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    res.status(400).json({ error: `Invalid Solana wallet address (got ${addr.length} chars)` });
    return;
  }

  try {
    await db
      .update(usersTable)
      .set({ solanaWalletAddress: addr })
      .where(eq(usersTable.id, req.user!.userId));

    res.json({ success: true, walletAddress: addr });
  } catch (err: any) {
    console.error("[wallet] DB update failed:", err?.message);
    res.status(500).json({ error: "Database error: " + (err?.message || "unknown") });
  }
});

// Get editor's wallet address (for creator-to-editor payments)
router.get("/editor-wallet/:editorId", requireAuth, requireRole("creator"), async (req, res) => {
  const { editorId } = req.params as { editorId: string };
  const [editor] = await db
    .select({ solanaWalletAddress: usersTable.solanaWalletAddress })
    .from(usersTable)
    .where(eq(usersTable.id, editorId))
    .limit(1);

  if (!editor?.solanaWalletAddress) {
    res.status(404).json({ error: "Editor has not set up a Solana wallet address" });
    return;
  }

  res.json({ walletAddress: editor.solanaWalletAddress });
});

// Remove Solana wallet address
router.delete("/wallet", requireAuth, async (req, res) => {
  await db
    .update(usersTable)
    .set({ solanaWalletAddress: null })
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ success: true });
});

// Creator sends email invites to editors
router.post("/invite", requireAuth, requireRole("creator"), async (req, res) => {
  const { emails, message } = req.body as { emails: string[]; message?: string };
  if (!emails?.length) { res.status(400).json({ error: "At least one email is required" }); return; }

  const [creator] = await db.select({ name: usersTable.name, inviteCode: usersTable.inviteCode })
    .from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  const { sendEmail } = await import("../lib/mailer.js");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const inviteLink = `${frontendUrl}/register?role=editor&inviteCode=${creator?.inviteCode || ""}`;

  await Promise.all(emails.map(email =>
    sendEmail(email, `${creator?.name || "A creator"} invited you to MediaLayer`, `
      <p>Hi,</p>
      <p><strong>${creator?.name || "A creator"}</strong> has invited you to join their workspace on MediaLayer.</p>
      ${message ? `<p>"${message}"</p>` : ""}
      <p>Click below to create your editor account and join their workspace:</p>
      <p><a href="${inviteLink}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
      <p>Or use invite code: <strong>${creator?.inviteCode}</strong></p>
    `).catch(() => {})
  ));

  res.json({ success: true, message: `Invites sent to ${emails.length} editor(s)` });
});

export default router;
