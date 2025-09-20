import crypto from "crypto";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = uuidv5("chunk.mcp-nn", uuidv5.URL);

export function checksum(content: Buffer | string): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}

export function checksumStream(parts: (Buffer | string)[]): string {
  const hash = crypto.createHash("sha1");
  for (const part of parts) {
    hash.update(part);
  }
  return hash.digest("hex");
}

export function chunkId(path: string, page: number | undefined, start: number | undefined, end: number | undefined): string {
  const data = `${path}::${page ?? "-"}::${start ?? "-"}::${end ?? "-"}`;
  return uuidv5(data, NAMESPACE);
}

export function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/[\t\r]+/g, " ").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
