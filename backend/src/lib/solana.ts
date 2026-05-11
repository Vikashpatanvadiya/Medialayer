import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export function getConnection(): Connection {
  const network = (process.env.SOLANA_NETWORK || "devnet") as "devnet" | "mainnet-beta" | "testnet";
  const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl(network);
  return new Connection(rpcUrl, "confirmed");
}

export interface VerifyResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifies that a Solana transaction:
 * 1. Exists and is confirmed
 * 2. Did not fail
 * 3. Is not older than 10 minutes
 * 4. Transferred at least `expectedLamports` to `expectedReceiver`
 */
export async function verifySOLTransfer(
  txSignature: string,
  expectedReceiver: string,
  expectedLamports: number
): Promise<VerifyResult> {
  try {
    const connection = getConnection();
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return { valid: false, error: "Transaction not found" };
    if (tx.meta?.err) return { valid: false, error: "Transaction failed on-chain" };

    // Check tx is not older than 10 minutes
    const txAge = Date.now() / 1000 - (tx.blockTime ?? 0);
    if (txAge > 600) return { valid: false, error: "Transaction too old (max 10 minutes)" };

    // Find receiver in account keys and check lamport delta
    const accountKeys = tx.transaction.message.staticAccountKeys;
    const receiverIdx = accountKeys.findIndex(
      (k) => k.toString() === expectedReceiver
    );

    if (receiverIdx === -1) return { valid: false, error: "Wrong receiver — platform wallet not found in tx" };

    const received =
      (tx.meta.postBalances[receiverIdx] ?? 0) -
      (tx.meta.preBalances[receiverIdx] ?? 0);

    if (received < expectedLamports) {
      return {
        valid: false,
        error: `Wrong amount — expected ${expectedLamports} lamports, got ${received}`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `RPC error: ${err?.message || String(err)}` };
  }
}

/**
 * Verifies a SOL transfer between two arbitrary parties (for editor payments).
 * Checks receiver, lamports, and that tx is not failed.
 * No time check — editor payments can be verified later.
 */
export async function verifyEditorPayment(
  txSignature: string,
  expectedReceiver: string,
  expectedLamports: number
): Promise<VerifyResult> {
  try {
    const connection = getConnection();
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return { valid: false, error: "Transaction not found" };
    if (tx.meta?.err) return { valid: false, error: "Transaction failed on-chain" };

    const accountKeys = tx.transaction.message.staticAccountKeys;
    const receiverIdx = accountKeys.findIndex(
      (k) => k.toString() === expectedReceiver
    );

    if (receiverIdx === -1) return { valid: false, error: "Editor wallet not found in transaction" };

    const received =
      (tx.meta.postBalances[receiverIdx] ?? 0) -
      (tx.meta.preBalances[receiverIdx] ?? 0);

    if (received < expectedLamports) {
      return {
        valid: false,
        error: `Wrong amount — expected ${expectedLamports} lamports, got ${received}`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: `RPC error: ${err?.message || String(err)}` };
  }
}
