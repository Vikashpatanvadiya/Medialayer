import { createHash } from "node:crypto";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getConnection } from "./solana.js";

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export interface ApprovalMemoPayload {
  videoId: string;
  projectId: string;
  version: number;
  approverId: string;
  timestamp: number;
}

export function buildApprovalHash(payload: ApprovalMemoPayload): string {
  const canonical = [
    payload.videoId,
    payload.projectId,
    String(payload.version),
    payload.approverId,
    String(payload.timestamp),
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export function buildMemoText(payload: ApprovalMemoPayload, hash: string): string {
  return JSON.stringify({
    type: "medialayer-approval",
    h: hash,
    v: payload.videoId,
    p: payload.projectId,
    n: payload.version,
    a: payload.approverId,
    ts: payload.timestamp,
  });
}

function loadPlatformKeypair(): Keypair {
  const raw =
    process.env.PLATFORM_WALLET_PRIVATE_KEY ||
    process.env.PLATFORM_SOLANA_KEYPAIR;

  if (!raw) {
    throw new Error("PLATFORM_WALLET_PRIVATE_KEY is not configured");
  }

  try {
    if (raw.trim().startsWith("[")) {
      const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
      return Keypair.fromSecretKey(bytes);
    }

    return Keypair.fromSecretKey(bs58.decode(raw.trim()));
  } catch {
    throw new Error("Invalid PLATFORM_WALLET_PRIVATE_KEY format");
  }
}

/**
 * Writes an immutable SPL Memo transaction recording a video approval.
 * Returns the on-chain transaction signature.
 */
export async function submitApprovalMemo(payload: ApprovalMemoPayload): Promise<{
  txSignature: string;
  videoHash: string;
  memoText: string;
}> {
  const hash = buildApprovalHash(payload);
  const memoText = buildMemoText(payload, hash);

  if (Buffer.byteLength(memoText, "utf8") > 500) {
    throw new Error("Approval memo payload exceeds 500 bytes");
  }

  const keypair = loadPlatformKeypair();
  const connection = getConnection();

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, "utf8"),
  });

  const transaction = new Transaction().add(instruction);
  const txSignature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
    commitment: "confirmed",
  });

  return { txSignature, videoHash: hash, memoText };
}
