import { db, approvalReceiptsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { submitApprovalMemo } from "./approvalMemo.js";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitWithRetry(payload: Parameters<typeof submitApprovalMemo>[0]) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await submitApprovalMemo(payload);
    } catch (err) {
      lastError = err;
      console.error(`[approval-memo] attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

export async function getLatestApprovalReceipt(videoId: string) {
  const [receipt] = await db
    .select()
    .from(approvalReceiptsTable)
    .where(eq(approvalReceiptsTable.videoId, videoId))
    .orderBy(desc(approvalReceiptsTable.createdAt))
    .limit(1);

  return receipt ?? null;
}

/**
 * Fire-and-forget helper: records approval on Solana and persists the receipt.
 * Never throws — errors are logged and stored on the receipt row.
 */
export async function recordApprovalReceipt(input: {
  videoId: string;
  projectId: string;
  approverId: string;
}): Promise<void> {
  const timestamp = Date.now();

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(approvalReceiptsTable)
    .where(eq(approvalReceiptsTable.videoId, input.videoId));

  const version = existingCount + 1;
  const payload = {
    videoId: input.videoId,
    projectId: input.projectId,
    version,
    approverId: input.approverId,
    timestamp,
  };

  const [pendingReceipt] = await db
    .insert(approvalReceiptsTable)
    .values({
      videoId: input.videoId,
      approverId: input.approverId,
      version,
      videoHash: "pending",
      status: "pending",
    })
    .returning();

  try {
    const { txSignature, videoHash } = await submitWithRetry(payload);

    await db
      .update(approvalReceiptsTable)
      .set({
        txSignature,
        videoHash,
        status: "confirmed",
        errorMessage: null,
      })
      .where(eq(approvalReceiptsTable.id, pendingReceipt.id));

    console.info(
      `[approval-memo] recorded approval for video ${input.videoId} → ${txSignature}`,
    );
  } catch (err: any) {
    const message = err?.message || String(err);

    await db
      .update(approvalReceiptsTable)
      .set({
        status: "failed",
        errorMessage: message,
      })
      .where(eq(approvalReceiptsTable.id, pendingReceipt.id));

    console.error(
      `[approval-memo] failed to record approval for video ${input.videoId}:`,
      message,
    );
  }
}
