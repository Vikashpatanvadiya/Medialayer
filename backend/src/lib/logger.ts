import { db, logsTable } from "@workspace/db";

export async function logAction(
  userId: string,
  action: string,
  videoId?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await db.insert(logsTable).values({
      userId,
      action,
      videoId: videoId ?? null,
      meta: meta ?? null,
    });
  } catch (err) {
    // Non-blocking — log errors should never crash the request
    console.error("[logger] Failed to write log:", err);
  }
}
