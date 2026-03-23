import { Router } from "express";
import { db, videosTable, usersTable, notificationsTable, editorCreatorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { CreateVideoBody, RejectVideoBody } from "@workspace/api-zod";
import { logAction } from "../lib/logger.js";
import { sendEmail, emailTemplates } from "../lib/mailer.js";

const router = Router();

function formatVideo(
  video: typeof videosTable.$inferSelect,
  creator?: typeof usersTable.$inferSelect,
  editor?: typeof usersTable.$inferSelect,
) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    tags: video.tags || [],
    videoUrl: video.videoUrl,
    storedFilename: video.storedFilename ?? undefined,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    status: video.status,
    creatorId: video.creatorId,
    editorId: video.editorId,
    rejectionFeedback: video.rejectionFeedback ?? undefined,
    fileSize: video.fileSize ?? undefined,
    duration: video.duration ?? undefined,
    youtubeVideoId: video.youtubeVideoId ?? undefined,
    youtubeUrl: video.youtubeUrl ?? undefined,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    creator: creator
      ? { id: creator.id, email: creator.email, name: creator.name, role: creator.role, createdAt: creator.createdAt }
      : undefined,
    editor: editor
      ? { id: editor.id, email: editor.email, name: editor.name, role: editor.role, createdAt: editor.createdAt }
      : undefined,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { status, creatorId } = req.query as { status?: string; creatorId?: string };
  const user = req.user!;

  const videos = user.role === "editor"
    ? await db.select().from(videosTable).where(eq(videosTable.editorId, user.userId))
    : await db.select().from(videosTable).where(eq(videosTable.creatorId, user.userId));

  const filtered = videos.filter((v) => {
    if (status && v.status !== status) return false;
    if (creatorId && v.creatorId !== creatorId) return false;
    return true;
  });

  const enriched = await Promise.all(
    filtered.map(async (video) => {
      const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, video.creatorId)).limit(1);
      const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);
      return formatVideo(video, creator, editor);
    }),
  );

  res.json({ videos: enriched });
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  // Fetch editor to get their linked creators
  const [editorUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  // Check editor has at least one linked creator
  const links = await db.select().from(editorCreatorsTable).where(eq(editorCreatorsTable.editorId, req.user!.userId));
  if (links.length === 0) {
    res.status(403).json({ error: "You must link to a creator before submitting videos. Ask your creator for their invite code." });
    return;
  }

  const { title, description, tags, videoUrl, thumbnailUrl, fileSize, duration } = parsed.data;
  const storedFilename = req.body.storedFilename as string | undefined;

  // creatorId comes from the request body (editor picks from their linked creators)
  const creatorId = req.body.creatorId as string;
  if (!creatorId) { res.status(400).json({ error: "creatorId is required" }); return; }

  // Verify editor is actually linked to this creator
  const [validLink] = await db.select().from(editorCreatorsTable)
    .where(and(eq(editorCreatorsTable.editorId, req.user!.userId), eq(editorCreatorsTable.creatorId, creatorId)))
    .limit(1);
  if (!validLink) { res.status(403).json({ error: "You are not linked to this creator" }); return; }

  const [video] = await db
    .insert(videosTable)
    .values({
      title,
      description,
      tags: tags || [],
      videoUrl,
      storedFilename: storedFilename ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      creatorId,
      editorId: req.user!.userId,
      fileSize: fileSize ?? null,
      duration: duration ?? null,
      status: "pending",
    })
    .returning();

  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, creatorId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: creatorId,
    title: "New video awaiting approval",
    message: `${editor?.name || "An editor"} submitted "${title}" for your review`,
    type: "video_pending",
    videoId: video.id,
  });

  await logAction(req.user!.userId, "submitted_for_review", video.id, { title, creatorId });

  // Email notification to creator
  if (creator?.email) {
    const tpl = emailTemplates.videoSubmitted(editor?.name || "An editor", title);
    await sendEmail(creator.email, tpl.subject, tpl.html);
  }

  res.status(201).json(formatVideo(video, creator, editor));
});

router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  const user = req.user!;
  if (user.role === "editor" && video.editorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (user.role === "creator" && video.creatorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, video.creatorId)).limit(1);
  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  res.json(formatVideo(video, creator, editor));
});

router.post("/:id/approve", requireAuth, requireRole("creator"), async (req, res) => {
  const { id } = req.params;
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  if (video.creatorId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db
    .update(videosTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: video.editorId,
    title: "Video approved!",
    message: `${creator?.name || "The creator"} approved "${video.title}". It's ready to upload to YouTube.`,
    type: "video_approved",
    videoId: video.id,
  });

  await logAction(req.user!.userId, "approved", id);

  // Email notification to editor
  if (editor?.email) {
    const tpl = emailTemplates.videoApproved(creator?.name || "The creator", video.title);
    await sendEmail(editor.email, tpl.subject, tpl.html);
  }

  res.json(formatVideo(updated, creator, editor));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  // Editors can only delete their own videos; creators can only delete videos submitted to them
  if (user.role === "editor" && video.editorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (user.role === "creator" && video.creatorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (video.status === "uploaded") { res.status(400).json({ error: "Cannot delete a video that has already been uploaded to YouTube" }); return; }

  if (video.storedFilename) {
    const { default: fs } = await import("fs");
    const { default: path } = await import("path");
    const filePath = path.join(process.cwd(), "uploads", video.storedFilename);
    fs.unlink(filePath, () => {});
  }

  await db.delete(notificationsTable).where(eq(notificationsTable.videoId, id));
  await db.delete(videosTable).where(eq(videosTable.id, id));

  res.json({ message: "Video deleted successfully" });
});

router.post("/:id/reject", requireAuth, requireRole("creator"), async (req, res) => {
  const { id } = req.params;
  const parsed = RejectVideoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }
  if (video.creatorId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db
    .update(videosTable)
    .set({ status: "rejected", rejectionFeedback: parsed.data.feedback, updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: video.editorId,
    title: "Video needs revisions",
    message: `${creator?.name || "The creator"} requested changes to "${video.title}": ${parsed.data.feedback}`,
    type: "video_rejected",
    videoId: video.id,
  });

  await logAction(req.user!.userId, "rejected", id, { feedback: parsed.data.feedback });

  // Email notification to editor
  if (editor?.email) {
    const tpl = emailTemplates.videoRejected(creator?.name || "The creator", video.title, parsed.data.feedback);
    await sendEmail(editor.email, tpl.subject, tpl.html);
  }

  res.json(formatVideo(updated, creator, editor));
});

// Rollback:
// Creator: approved → pending
// Editor: rejected → pending
router.post("/:id/rollback", requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = req.user!;

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);
  if (!video) { res.status(404).json({ error: "Video not found" }); return; }

  if (user.role === "creator") {
    if (video.creatorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (video.status !== "approved") { res.status(400).json({ error: "Only approved videos can be rolled back by the creator" }); return; }

    const [updated] = await db
      .update(videosTable)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(videosTable.id, id))
      .returning();

    const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, user.userId)).limit(1);
    const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

    await db.insert(notificationsTable).values({
      userId: video.editorId,
      title: "Video sent back for review",
      message: `${creator?.name || "The creator"} rolled back "${video.title}" to pending for re-review.`,
      type: "video_pending",
      videoId: video.id,
    });

    await logAction(user.userId, "rollback_approved_to_pending", id);

    res.json(formatVideo(updated, creator, editor));
    return;
  }

  if (user.role === "editor") {
    if (video.editorId !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (video.status !== "rejected") { res.status(400).json({ error: "Only rejected videos can be rolled back by the editor" }); return; }

    const [updated] = await db
      .update(videosTable)
      .set({ status: "pending", rejectionFeedback: null, updatedAt: new Date() })
      .where(eq(videosTable.id, id))
      .returning();

    const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, video.creatorId)).limit(1);
    const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, user.userId)).limit(1);

    await db.insert(notificationsTable).values({
      userId: video.creatorId,
      title: "Video resubmitted for review",
      message: `${editor?.name || "The editor"} resubmitted "${video.title}" for your review.`,
      type: "video_pending",
      videoId: video.id,
    });

    await logAction(user.userId, "rollback_rejected_to_pending", id);

    res.json(formatVideo(updated, creator, editor));
    return;
  }

  res.status(403).json({ error: "Forbidden" });
});

export default router;
