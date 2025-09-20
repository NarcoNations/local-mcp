import { createHash } from "node:crypto";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = "6f86c801-7ce6-4b87-bf74-468f09d4899f";

export function hashFile(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function chunkId(path: string, page: number | undefined, start: number, end: number): string {
  return uuidv5(`${path}:${page ?? "-"}:${start}:${end}`, NAMESPACE);
}
