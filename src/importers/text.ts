import { basename } from "node:path";
import type { ImportContext, ImportResult } from "./types.js";
import { buildContentHash, readUtf8 } from "./utils.js";

export async function importPlainText(context: ImportContext): Promise<ImportResult[]> {
  const text = (await readUtf8(context.filePath)).trim();
  if (!text) return [];

  const title = basename(context.filePath);
  const sections = [{ heading: undefined, text, order: 0 }];
  const documentMeta = {
    title,
    pathOrUri: context.filePath,
    contentType: "text",
    meta: {},
  } as const;

  return [{
    source: {
      kind: "file",
      origin: context.filePath,
    },
    document: documentMeta,
    sections,
    contentHash: buildContentHash(sections, documentMeta),
  }];
}
