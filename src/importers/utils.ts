import fs from "node:fs/promises";
import path from "node:path";
import { sha256 } from "../utils/hash.js";
import type { ImportDocumentMeta, Section } from "./types.js";

export async function readUtf8(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return buffer.toString("utf8");
}

export function buildContentHash(sections: Section[], meta: ImportDocumentMeta): string {
  const payload = {
    meta,
    sections: sections.map((section) => ({
      heading: section.heading,
      textHash: sha256(section.text),
      page: section.page,
      order: section.order,
    })),
  };
  return sha256(JSON.stringify(payload));
}

export function normalisePath(input: string): string {
  return path.normalize(input);
}

export function ensureSlug(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function dossierRouteHint(slug?: string): string | undefined {
  const clean = ensureSlug(slug);
  return clean ? `#/${clean}` : undefined;
}

export function nodeRouteHint(slug?: string, narrativeSlug?: string): string | undefined {
  const slugValue = ensureSlug(slug ?? narrativeSlug);
  return slugValue ? `/nodes/${slugValue}` : undefined;
}

export function flattenJsonForSearch(obj: unknown, prefix = ""): string[] {
  const lines: string[] = [];
  if (obj === null || obj === undefined) return lines;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      lines.push(...flattenJsonForSearch(item, `${prefix}[${index}]`));
    });
    return lines;
  }
  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${key}` : key;
      lines.push(...flattenJsonForSearch(value, next));
    }
    return lines;
  }
  lines.push(`${prefix}: ${String(obj)}`);
  return lines;
}

export const SUPPORTED_EXTENSIONS = [
  ".docx",
  ".pdf",
  ".pages",
  ".md",
  ".markdown",
  ".txt",
  ".json",
  ".jsonl",
  ".csv",
];
