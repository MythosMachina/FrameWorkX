import crypto from "node:crypto";

const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;

export function deriveKey(installKey: string, salt: Buffer): Buffer {
  return crypto.scryptSync(installKey, salt, KEY_LEN);
}

export function encryptWithKey(installKey: string, plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(installKey, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decryptWithKey(installKey: string, payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const salt = raw.subarray(0, SALT_LEN);
  const iv = raw.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = raw.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + 16);
  const encrypted = raw.subarray(SALT_LEN + IV_LEN + 16);
  const key = deriveKey(installKey, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
