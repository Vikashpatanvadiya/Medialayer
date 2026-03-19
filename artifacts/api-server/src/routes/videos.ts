import { Router } from "express";
import { db, videosTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { CreateVideoBody, RejectVideoBody } from "@workspace/api-zod";

const router = Router();

function formatVideo(video: typeof videosTable.$inferSelect, creator?: typeof usersTable.$inferSelect, editor?: typeof usersTable.$inferSelect) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    tags: video.tags || [],
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    status: video.status,
    creatorId: video.creatorId,
    editorId: video.editorId,
    rejectionFeedback: video.rejectionFeedback ?? undefined,
    fileSize: video.fileSize ?? undefined,
    duration: video.duration ?? undefined,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    creator: creator ? {
      id: creator.id,
      email: creator.email,
      name: creator.name,
      role: creator.role,
      createdAt: creator.createdAt,
    } : undefined,
    editor: editor ? {
      id: editor.id,
      email: editor.email,
      name: editor.name,
      role: editor.role,
      createdAt: editor.createdAt,
    } : undefined,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { status, creatorId } = req.query as { status?: string; creatorId?: string };
  const user = req.user!;

  let query;
  if (user.role === "editor") {
    query = db.select().from(videosTable).where(eq(videosTable.editorId, user.userId));
  } else {
    query = db.select().from(videosTable).where(eq(videosTable.creatorId, user.userId));
  }

  const videos = await query;

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
    })
  );

  res.json({ videos: enriched });
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { title, description, tags, videoUrl, thumbnailUrl, creatorId, fileSize, duration } = parsed.data;

  const [video] = await db
    .insert(videosTable)
    .values({
      title,
      description,
      tags: tags || [],
      videoUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      creatorId,
      editorId: req.user!.userId,
      fileSize: fileSize ?? null,
      duration: duration ?? null,
      status: "pending",
    })
    .returning();

  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: creatorId,
    title: "New video awaiting approval",
    message: `${editor?.name || "An editor"} submitted "${title}" for your review`,
    type: "video_pending",
    videoId: video.id,
  });

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, creatorId)).limit(1);

  res.status(201).json(formatVideo(video, creator, editor));
});

router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  const user = req.user!;
  if (user.role === "editor" && video.editorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (user.role === "creator" && video.creatorId !== user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, video.creatorId)).limit(1);
  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  res.json(formatVideo(video, creator, editor));
});

router.post("/:id/approve", requireAuth, requireRole("creator"), async (req, res) => {
  const { id } = req.params;
  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  if (video.creatorId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(videosTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: video.editorId,
    title: "Video approved!",
    message: `${creator?.name || "The creator"} approved "${video.title}". It's ready to upload to YouTube.`,
    type: "video_approved",
    videoId: video.id,
  });

  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  res.json(formatVideo(updated, creator, editor));
});

router.post("/:id/reject", requireAuth, requireRole("creator"), async (req, res) => {
  const { id } = req.params;
  const parsed = RejectVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, id)).limit(1);

  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  if (video.creatorId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(videosTable)
    .set({ status: "rejected", rejectionFeedback: parsed.data.feedback, updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();

  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  await db.insert(notificationsTable).values({
    userId: video.editorId,
    title: "Video needs revisions",
    message: `${creator?.name || "The creator"} requested changes to "${video.title}": ${parsed.data.feedback}`,
    type: "video_rejected",
    videoId: video.id,
  });

  const [editor] = await db.select().from(usersTable).where(eq(usersTable.id, video.editorId)).limit(1);

  res.json(formatVideo(updated, creator, editor));
});

export default router;
