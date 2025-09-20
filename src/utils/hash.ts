import crypto from "crypto";
import { v5 as uuidv5 } from "uuid";

const BASE_NAMESPACE = uuidv5("https://narconations.org/mcp-nn", uuidv5.URL);

export function sha1(data: string | Buffer): string {
  return crypto.createHash("sha1").update(data).digest("hex");
}

export function chunkNamespace(path: string): string {
  return uuidv5(path, BASE_NAMESPACE);
}

export function chunkId(path: string, page: number | undefined, start: number | undefined): string {
  const scope = [path, page ?? "", start ?? ""].join("::");
  return uuidv5(scope, chunkNamespace(path));
}
