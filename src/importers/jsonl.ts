import path from "node:path";
import type { ImportContext, ImportResult } from "./types.js";
import { buildContentHash, flattenJsonForSearch, ensureSlug, readUtf8 } from "./utils.js";

export async function importJsonl(context: ImportContext): Promise<ImportResult[]> {
  const raw = await readUtf8(context.filePath);
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results: ImportResult[] = [];
  lines.forEach((line: string, idx: number) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      return;
    }
    const flattened = flattenJsonForSearch(parsed);
    if (flattened.length === 0) return;
    const slug = ensureSlug((parsed as Record<string, unknown>)?.slug as string | undefined);
    const narrativeSlug = ensureSlug((parsed as Record<string, unknown>)?.narrative_slug as string | undefined);
    const routeHint = slug ? `/nodes/${slug}` : narrativeSlug ? `/nodes/${narrativeSlug}` : undefined;
    const text = flattened.join("\n");
    const title = `${path.basename(context.filePath)}#${idx + 1}`;
    const meta: Record<string, unknown> = { raw: parsed, line: idx + 1 };
    const documentMeta = {
      title,
      pathOrUri: context.filePath,
      contentType: "node",
      slug: slug ?? narrativeSlug,
      routeHint,
      meta,
    } as const;
    const sections = [{ heading: undefined, text, order: 0 }];
    results.push({
      source: { kind: "file", origin: context.filePath },
      document: documentMeta,
      sections,
      contentHash: buildContentHash(sections, documentMeta),
    });
  });
  return results;
}
