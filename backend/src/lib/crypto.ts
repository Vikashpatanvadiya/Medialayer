import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Derive a 32-byte key from JWT_SECRET using SHA-256
function getKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  // Store as iv:ciphertext (both hex)
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":");
  // If it doesn't look like iv:ciphertext hex format, it's a legacy plain text token
  if (parts.length !== 2 || parts[0].length !== 32) {
    return ciphertext; // return as-is (plain text legacy token)
  }
  const [ivHex, encHex] = parts;
  try {
    const decipher = createDecipheriv("aes-256-cbc", getKey(), Buffer.from(ivHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // Decryption failed — treat as plain text legacy token
    return ciphertext;
  }
}
