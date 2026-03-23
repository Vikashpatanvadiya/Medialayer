import { Router } from "express";
import { db, logsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// Only creators can view logs (for their own videos' activity)
router.get("/", requireAuth, requireRole("creator"), async (req, res) => {
  const logs = await db
    .select({
      id: logsTable.id,
      action: logsTable.action,
      videoId: logsTable.videoId,
      meta: logsTable.meta,
      createdAt: logsTable.createdAt,
      user: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
      },
    })
    .from(logsTable)
    .innerJoin(usersTable, eq(logsTable.userId, usersTable.id))
    .orderBy(desc(logsTable.createdAt))
    .limit(100);

  res.json({ logs });
});

export default router;
