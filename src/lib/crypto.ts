import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password hashing using scrypt (Node built-in, no external deps).
 * Format: "scrypt$<saltHex>$<hashHex>"
 */
const KEY_LEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * App-level symmetric encryption for stored provider tokens.
 * Uses AES-256-GCM with a key derived from ENCRYPTION_KEY env var.
 * Returns "v1:$ivHex:$ciphertextHex:$tagHex".
 */
import { createCipheriv, createDecipheriv } from "crypto";

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "veltrix-dev-only-key-please-set-ENCRYPTION_KEY";
  // Derive a 32-byte key via sha256 to support variable-length input.
  return createHash("sha256").update(raw).digest();
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1$${iv.toString("hex")}$${ct.toString("hex")}$${tag.toString("hex")}`;
}

export function decryptToken(payload: string): string {
  if (!payload) return "";
  const parts = payload.split("$");
  if (parts.length !== 4 || parts[0] !== "v1") {
    // Legacy unencrypted — return as-is (for dev convenience only).
    return payload;
  }
  const iv = Buffer.from(parts[1], "hex");
  const ct = Buffer.from(parts[2], "hex");
  const tag = Buffer.from(parts[3], "hex");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
