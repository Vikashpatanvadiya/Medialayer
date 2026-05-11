import { db, videosTable, usersTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";

export const PLAN_LIMITS = {
  free: 3,
  starter: 25,
  pro: Infinity,
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export class PlanLimitError extends Error {
  constructor(plan: Plan, limit: number) {
    super(
      plan === "free"
        ? `Free plan allows ${limit} video uploads per month. Upgrade to Starter or Pro to upload more.`
        : `Starter plan allows ${limit} video uploads per month. Upgrade to Pro for unlimited uploads.`
    );
    this.name = "PlanLimitError";
  }
}

/**
 * Checks whether the editor has exceeded their plan's monthly upload limit.
 * Throws PlanLimitError if the limit is reached.
 */
export async function checkUploadLimit(userId: string): Promise<void> {
  // Get user's plan
  const [user] = await db
    .select({ plan: usersTable.plan })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const plan = (user?.plan ?? "free") as Plan;
  const limit = PLAN_LIMITS[plan];

  // Pro plan = unlimited
  if (limit === Infinity) return;

  // Count uploads this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ id: videosTable.id })
    .from(videosTable)
    .where(
      and(
        eq(videosTable.editorId, userId),
        gte(videosTable.createdAt, startOfMonth)
      )
    );

  if (rows.length >= limit) {
    throw new PlanLimitError(plan, limit);
  }
}

/** Returns the plan tier from a lamport amount */
export function planFromLamports(lamports: number): "starter" | "pro" | null {
  if (lamports >= 1_000_000_000) return "pro";      // 1.0 SOL
  if (lamports >= 500_000_000) return "starter";    // 0.5 SOL
  return null;
}

export const PLAN_PRICES_LAMPORTS: Record<"starter" | "pro", number> = {
  starter: 500_000_000,   // 0.5 SOL
  pro: 1_000_000_000,     // 1.0 SOL
};
