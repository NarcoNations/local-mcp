import path from "node:path";
import type { ImportContext, ImportResult, Section } from "./types.js";
import { buildContentHash, flattenJsonForSearch, ensureSlug, readUtf8 } from "./utils.js";

export async function importJson(context: ImportContext): Promise<ImportResult[]> {
  const raw = await readUtf8(context.filePath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return [];
  }

  const flattened = flattenJsonForSearch(parsed);
  if (flattened.length === 0) return [];

  const text = flattened.join("\n");
  const title = path.basename(context.filePath);
  const slug = ensureSlug((parsed as Record<string, unknown>)?.slug as string | undefined);
  const routeHint = slug ? `#/${slug}` : undefined;
  const confidence = typeof (parsed as Record<string, unknown>)?.confidence === "number" ? Number((parsed as Record<string, unknown>)?.confidence) : undefined;

  const sections: Section[] = [{ heading: undefined, text, order: 0 }];
  const documentMeta = {
    title,
    pathOrUri: context.filePath,
    contentType: "other",
    slug,
    routeHint,
    meta: { raw: parsed },
    confidence,
  } as const;

  return [{
    source: { kind: "file", origin: context.filePath },
    document: documentMeta,
    sections,
    contentHash: buildContentHash(sections, documentMeta),
  }];
}
