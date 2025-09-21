import { parse } from "csv-parse/sync";
import type { ImportContext, ImportResult, Section } from "./types.js";
import { buildContentHash, ensureSlug, readUtf8 } from "./utils.js";

const EXPECTED_HEADERS = ["id", "name", "slug", "coords", "dataset", "summary", "tags", "narrative_slug", "last_updated"];

export async function importCsvNodes(context: ImportContext): Promise<ImportResult[]> {
  const raw = await readUtf8(context.filePath);
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  if (!Array.isArray(records) || records.length === 0) return [];

  const results: ImportResult[] = [];
  records.forEach((record: Record<string, string>, idx: number) => {
    const meta: Record<string, unknown> = { raw: record };
    const slug = ensureSlug(record.slug ?? record.narrative_slug ?? record.name);
    const narrativeSlug = ensureSlug(record.narrative_slug);
    const routeHint = slug ? `/nodes/${slug}` : narrativeSlug ? `/nodes/${narrativeSlug}` : undefined;
    const tags = record.tags ? record.tags.split(/[,;]+/).map((tag) => tag.trim()).filter(Boolean) : [];
    if (tags.length) {
      meta.tags = tags;
    }
    if (record.last_updated) {
      meta.last_updated = record.last_updated;
    }

    const lines: string[] = [];
    EXPECTED_HEADERS.forEach((header) => {
      if (record[header] !== undefined && record[header] !== "") {
        lines.push(`${header}: ${record[header]}`);
      }
    });
    const text = lines.join("\n");
    if (!text) return;
    const sections: Section[] = [{ heading: record.name, text, order: 0 }];
    const documentMeta = {
      title: record.name || `Node ${idx + 1}`,
      pathOrUri: context.filePath,
      contentType: "node",
      slug,
      routeHint,
      meta,
    } as const;
    results.push({
      source: { kind: "file", origin: context.filePath },
      document: documentMeta,
      sections,
      contentHash: buildContentHash(sections, documentMeta),
    });
  });

  return results;
}
