import { Router, type IRouter } from "express";
import { and, asc, eq, gte, isNotNull, lte, or } from "drizzle-orm";
import { db, usersTable, videosTable, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth.js";
import { logAction } from "../lib/logger.js";
import { formatInZone, resetReminderFields } from "../lib/schedule-reminders.js";

const router: IRouter = Router();

/** Either party to a video may schedule it; nobody else may see or touch it. */
function isParticipant(video: typeof videosTable.$inferSelect, userId: string): boolean {
  return video.creatorId === userId || video.editorId === userId;
}

function calendarEntry(row: {
  video: typeof videosTable.$inferSelect;
  creatorName: string | null;
  editorName: string | null;
}) {
  const { video } = row;
  return {
    id: video.id,
    title: video.title,
    status: video.status,
    mediaType: video.mediaType,
    destination: video.destination,
    format: video.format,
    scheduledAt: video.scheduledAt,
    scheduleTimezone: video.scheduleTimezone,
    thumbnailUrl: video.thumbnailUrl,
    youtubeUrl: video.youtubeUrl,
    creatorName: row.creatorName,
    editorName: row.editorName,
  };
}

/**
 * GET /api/schedule?from=ISO&to=ISO
 * Scheduled posts the caller is party to, for the calendar's visible window.
 */
router.get("/", requireAuth, async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };

  const fromDate = from ? new Date(from) : new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date(Date.now() + 92 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    res.status(400).json({ error: "from and to must be valid dates" });
    return;
  }

  const userId = req.user!.userId;
  const creators = { name: usersTable.name };

  const rows = await db
    .select({ video: videosTable, creatorName: creators.name })
    .from(videosTable)
    .innerJoin(usersTable, eq(videosTable.creatorId, usersTable.id))
    .where(
      and(
        or(eq(videosTable.creatorId, userId), eq(videosTable.editorId, userId)),
        isNotNull(videosTable.scheduledAt),
        gte(videosTable.scheduledAt, fromDate),
        lte(videosTable.scheduledAt, toDate),
      ),
    )
    .orderBy(asc(videosTable.scheduledAt));

  res.json({
    posts: rows.map((row) => calendarEntry({ ...row, editorName: null })),
  });
});

/**
 * PATCH /api/schedule/:videoId
 * Body: { scheduledAt: ISO string | null, timezone?: string }
 * Both the creator and the editor can set or clear a schedule at any time.
 */
router.patch("/:videoId", requireAuth, async (req, res) => {
  const { videoId } = req.params as { videoId: string };
  const { scheduledAt, timezone } = (req.body ?? {}) as {
    scheduledAt?: string | null;
    timezone?: string;
  };

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, videoId)).limit(1);
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  if (!isParticipant(video, req.user!.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Clearing the schedule.
  if (scheduledAt === null || scheduledAt === "") {
    const [updated] = await db
      .update(videosTable)
      .set({ scheduledAt: null, scheduleTimezone: null, ...resetReminderFields(), updatedAt: new Date() })
      .where(eq(videosTable.id, videoId))
      .returning();
    await logAction(req.user!.userId, "schedule_cleared", videoId);
    res.json({ success: true, video: { id: updated.id, scheduledAt: null } });
    return;
  }

  const when = new Date(scheduledAt ?? "");
  if (Number.isNaN(when.getTime())) {
    res.status(400).json({ error: "scheduledAt must be an ISO date string or null" });
    return;
  }

  const [updated] = await db
    .update(videosTable)
    .set({
      scheduledAt: when,
      scheduleTimezone: timezone ?? video.scheduleTimezone ?? null,
      // A new time deserves fresh reminders.
      ...resetReminderFields(),
      updatedAt: new Date(),
    })
    .where(eq(videosTable.id, videoId))
    .returning();

  await logAction(req.user!.userId, "schedule_set", videoId, { scheduledAt: when.toISOString() });

  // Tell the other side, so a change never goes unnoticed.
  const counterpartId =
    req.user!.userId === video.creatorId ? video.editorId : video.creatorId;
  const timeLabel = formatInZone(when, timezone ?? video.scheduleTimezone);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone ?? video.scheduleTimezone ?? undefined,
  }).format(when);

  await db
    .insert(notificationsTable)
    .values({
      userId: counterpartId,
      title: "Post scheduled",
      message: `"${video.title}" is scheduled for ${dateLabel} at ${timeLabel}.`,
      type: "schedule_set",
      videoId: video.id,
    })
    .catch(() => {});

  res.json({
    success: true,
    video: {
      id: updated.id,
      scheduledAt: updated.scheduledAt,
      scheduleTimezone: updated.scheduleTimezone,
    },
  });
});

export default router;
