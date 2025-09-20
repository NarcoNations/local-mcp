import crypto from "crypto";

export function hashContent(...parts: (string | number | undefined | null)[]): string {
  const hash = crypto.createHash("sha256");
  for (const part of parts) {
    if (part === undefined || part === null) continue;
    hash.update(String(part));
    hash.update("\u0000");
  }
  return hash.digest("hex");
}
