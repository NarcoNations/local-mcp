import { basename } from "node:path";
import mammoth from "mammoth";
import type { ImportContext, ImportResult } from "./types.js";
import { buildContentHash } from "./utils.js";

export async function importDocx(context: ImportContext): Promise<ImportResult[]> {
  const result = await mammoth.convertToHtml({ path: context.filePath });
  const text = result.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const title = basename(context.filePath);
  const sections = [{ heading: undefined, text, order: 0 }];
  const documentMeta = {
    title,
    pathOrUri: context.filePath,
    contentType: "docx",
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
