import crypto from "crypto";

export function hashString(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}

export function sha256(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function uuidV5FromComponents(namespace: string, components: string[]): string {
  const hash = crypto.createHash("sha1");
  hash.update(namespace);
  for (const part of components) {
    hash.update("::");
    hash.update(part);
  }
  const digest = hash.digest();
  // use sha1 digest to generate UUIDv5-like string (not strict spec but deterministic)
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function chunkCacheKey(path: string, mtime: number, offsetStart?: number, offsetEnd?: number): string {
  return `${path}:${mtime}:${offsetStart ?? 0}:${offsetEnd ?? 0}`;
}
