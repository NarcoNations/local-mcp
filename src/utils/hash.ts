import crypto from "crypto";
import { v5 as uuidv5 } from "uuid";

const CHUNK_NAMESPACE = uuidv5("chunk.mcp-nn", uuidv5.URL);

export function hashContent(content: string): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}

export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

export function createChunkId(path: string, page: number | undefined, start: number | undefined, end: number | undefined): string {
  const raw = `${path}|${page ?? ""}|${start ?? 0}|${end ?? 0}`;
  return uuidv5(raw, CHUNK_NAMESPACE);
}

export function hashChunkInput(path: string, mtime: number, content: string): string {
  return crypto.createHash("sha1").update(path).update(String(mtime)).update(content).digest("hex");
}
