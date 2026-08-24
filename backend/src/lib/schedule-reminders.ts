import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db, notificationsTable, videosTable } from "@workspace/db";

/**
 * Reminder-only scheduling: MediaLayer never publishes on its own. Two
 * notifications are raised per scheduled post — one on the morning of, one when
 * the time arrives — and the creator publishes when they're ready.
 *
 * These are generated lazily whenever notifications are read rather than by a
 * background worker, so nothing depends on a process staying awake (Render's
 * free tier sleeps). Each reminder is stamped on the video row, which makes the
 * work idempotent even if several requests race.
 */

/** Local hour at which the "posting today" reminder becomes due. */
const MORNING_HOUR = 8;

export type ReminderKind = "morning" | "due";

/** Formats an instant in the timezone the schedule was created in. */
export function formatInZone(date: Date, timeZone: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone || undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
}

/** Midnight-to-8am boundary of the scheduled day, in the schedule's own zone. */
function morningOf(scheduledAt: Date, timeZone: string | null): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(scheduledAt);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const localHour = get("hour");
    // Step back from the scheduled instant to MORNING_HOUR the same local day.
    const hoursBack = localHour - MORNING_HOUR;
    return new Date(scheduledAt.getTime() - hoursBack * 60 * 60 * 1000);
  } catch {
    return new Date(scheduledAt.getTime() - 4 * 60 * 60 * 1000);
  }
}

function destinationLabel(video: typeof videosTable.$inferSelect): string {
  if (video.destination === "instagram") {
    return video.format === "reel" ? "Instagram Reel" : "Instagram post";
  }
  return video.format === "short" ? "YouTube Short" : "YouTube video";
}

/**
 * Raises any reminders now due for this user's scheduled posts.
 * Safe to call on every notifications fetch — it only writes when something is
 * actually due, and each reminder is written at most once.
 */
export async function ensureScheduleReminders(userId: string): Promise<number> {
  const now = new Date();

  // Only rows this user is party to, still scheduled, still missing a reminder.
  const candidates = await db
    .select()
    .from(videosTable)
    .where(
      and(
        or(eq(videosTable.creatorId, userId), eq(videosTable.editorId, userId)),
        lte(videosTable.scheduledAt, new Date(now.getTime() + 24 * 60 * 60 * 1000)),
        or(isNull(videosTable.reminderMorningSentAt), isNull(videosTable.reminderDueSentAt)),
      ),
    )
    .limit(50);

  let created = 0;

  for (const video of candidates) {
    if (!video.scheduledAt) continue;
    // Already published — a reminder would only be noise.
    if (video.status === "uploaded") continue;

    const scheduledAt = new Date(video.scheduledAt);
    const timeLabel = formatInZone(scheduledAt, video.scheduleTimezone);
    const what = destinationLabel(video);

    const dueMorning = !video.reminderMorningSentAt && now >= morningOf(scheduledAt, video.scheduleTimezone);
    const dueNow = !video.reminderDueSentAt && now >= scheduledAt;

    // When both are due at once (e.g. a late first visit), only the later one
    // is worth sending.
    if (dueNow) {
      await db.insert(notificationsTable).values({
        userId: video.creatorId,
        title: "Scheduled post is due now",
        message: `"${video.title}" was scheduled to go out at ${timeLabel} as a ${what}. Publish it when you're ready.`,
        type: "schedule_due",
        videoId: video.id,
      });
      await db
        .update(videosTable)
        .set({ reminderDueSentAt: now, reminderMorningSentAt: video.reminderMorningSentAt ?? now })
        .where(eq(videosTable.id, video.id));
      created += 1;
      continue;
    }

    if (dueMorning) {
      const ready = video.status === "approved";
      await db.insert(notificationsTable).values({
        userId: video.creatorId,
        title: "Posting today",
        message: ready
          ? `"${video.title}" goes out today at ${timeLabel} as a ${what}.`
          : `"${video.title}" is scheduled for today at ${timeLabel} as a ${what}, but it still needs your approval.`,
        type: "schedule_today",
        videoId: video.id,
      });
      await db
        .update(videosTable)
        .set({ reminderMorningSentAt: now })
        .where(eq(videosTable.id, video.id));
      created += 1;
    }
  }

  return created;
}

/** Clears reminder stamps so a rescheduled post notifies again. */
export function resetReminderFields() {
  return { reminderMorningSentAt: null, reminderDueSentAt: null };
}
