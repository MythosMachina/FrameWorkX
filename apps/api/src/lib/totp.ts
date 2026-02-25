import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(bytes = 20): string {
  return base32Encode(crypto.randomBytes(bytes));
}

export function normalizeTotpCode(code: string): string {
  return String(code ?? "").replace(/\s+/g, "").replace(/[^0-9]/g, "").slice(0, 6);
}

export function generateTotpCode(secretBase32: string, epochMs = Date.now(), stepSeconds = 30): string {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(epochMs / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(codeInt % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(secretBase32: string, code: string, window = 1): boolean {
  const normalized = normalizeTotpCode(code);
  if (normalized.length !== 6) return false;
  const now = Date.now();
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = generateTotpCode(secretBase32, now + offset * 30_000);
    if (timingSafeStringEqual(candidate, normalized)) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(issuer: string, accountLabel: string, secretBase32: string): string {
  const safeIssuer = encodeURIComponent(issuer);
  const safeLabel = encodeURIComponent(`${issuer}:${accountLabel}`);
  const secret = encodeURIComponent(secretBase32);
  return `otpauth://totp/${safeLabel}?secret=${secret}&issuer=${safeIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function hashIp(installKey: string, ip: string): string {
  return crypto.createHash("sha256").update(`${installKey}:ip:${ip}`).digest("hex");
}

export function hashUserAgent(installKey: string, userAgent: string): string {
  return crypto.createHash("sha256").update(`${installKey}:ua:${userAgent}`).digest("hex");
}

export function normalizeIpFromRequest(request: any): string {
  const forwarded = String(request.headers?.["x-forwarded-for"] ?? "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return String(request.ip ?? request.socket?.remoteAddress ?? "").trim();
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(`recovery:${normalizeRecoverySequence(code)}`).digest("hex");
}

export function normalizeRecoverySequence(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const format = detectRecoverySequenceFormat(raw);
  if (format === "matrix") {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .join(" ");
  }
  if (format === "legacy") {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

export function generateRecoverySequences(count = 4): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(generateRecoveryMatrixCode());
  }
  return out;
}

export function detectRecoverySequenceFormat(input: string): "matrix" | "legacy" | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9]{8}-[A-Za-z0-9]{8}( [A-Za-z0-9]{8}-[A-Za-z0-9]{8}){3}$/.test(raw)) {
    return "matrix";
  }
  if (/^[A-Za-z0-9]+-[A-Za-z0-9]+( [A-Za-z0-9]+-[A-Za-z0-9]+){3}$/.test(raw)) {
    return "legacy";
  }
  return null;
}

function generateRecoveryMatrixCode() {
  const pairs: string[] = [];
  for (let p = 0; p < 4; p += 1) {
    pairs.push(`${randomRecoveryBlock(8)}-${randomRecoveryBlock(8)}`);
  }
  return pairs.join(" ");
}

function randomRecoveryBlock(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function base32Encode(input: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = String(input ?? "").toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
