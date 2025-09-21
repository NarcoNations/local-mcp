import path from "node:path";
import matter from "gray-matter";
import type { ImportContext, ImportResult, Section } from "./types.js";
import { dossierRouteHint, buildContentHash, ensureSlug, readUtf8 } from "./utils.js";

function splitSections(content: string): Section[] {
  const lines = content.split(/\r?\n/);
  const sections: Section[] = [];
  let currentHeading: string | undefined;
  let buffer: string[] = [];
  let order = 0;

  const flush = () => {
    if (!buffer.length) return;
    sections.push({
      heading: currentHeading,
      text: buffer.join("\n").trim(),
      order: order++,
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2].trim();
      continue;
    }
    buffer.push(line);
  }
  flush();
  if (sections.length === 0) {
    sections.push({ heading: currentHeading, text: content.trim(), order: 0 });
  }
  return sections.filter((section) => section.text.length > 0);
}

export async function importMarkdown(context: ImportContext): Promise<ImportResult[]> {
  const raw = await readUtf8(context.filePath);
  const parsed = matter(raw);
  const front = parsed.data ?? {};
  const frontData = front as Record<string, unknown>;

  const slug = ensureSlug((frontData.slug as string | undefined) ?? (frontData.title as string | undefined));
  const title = (frontData.title as string | undefined) ?? path.basename(context.filePath);
  const updatedRaw = frontData.updated as string | undefined;
  const updatedAt = updatedRaw ? new Date(updatedRaw) : undefined;
  const tags = Array.isArray(frontData.tags)
    ? (frontData.tags as unknown[]).map((tag) => String(tag))
    : undefined;
  const author = frontData.author as string | undefined;
  const heroImage = frontData.hero_image as string | undefined;
  const confidence = frontData.confidence !== undefined ? Number(frontData.confidence) : undefined;

  const meta = {
    ...frontData,
    tags,
    slug,
    updated: updatedRaw,
  } as Record<string, unknown>;

  const sections = splitSections(parsed.content);

  const documentMeta = {
    title,
    pathOrUri: context.filePath,
    author,
    contentType: "dossier",
    slug,
    routeHint: dossierRouteHint(slug),
    heroImage,
    meta,
    confidence,
  } as const;

  const contentHash = buildContentHash(sections, documentMeta);

  return [{
    source: {
      kind: "file",
      origin: context.filePath,
    },
    document: {
      ...documentMeta,
      updatedAt,
    },
    sections,
    contentHash,
  }];
}
