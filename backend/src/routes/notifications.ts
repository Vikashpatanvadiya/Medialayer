import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { ensureScheduleReminders } from "../lib/schedule-reminders.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  // Schedule reminders are raised lazily here — no always-on worker needed.
  await ensureScheduleReminders(req.user!.userId).catch((err) =>
    console.error("[schedule] Reminder generation failed:", err?.message || err),
  );

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.userId))
    .orderBy(notificationsTable.createdAt);

  res.json({ notifications: notifications.reverse() });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [notification] = await db
    .select()
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, req.user!.userId)
      )
    )
    .limit(1);

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
