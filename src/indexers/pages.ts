import { promises as fs } from "node:fs";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import type { AppConfig, Chunk } from "../types.js";
import { chunkText } from "../pipeline/chunk.js";
import { normalizeForIndex, denyTraversal } from "../utils/fs-guard.js";
import { logger } from "../utils/logger.js";

function extractStrings(node: unknown, acc: string[]): void {
  if (typeof node === "string") {
    acc.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) extractStrings(item, acc);
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      extractStrings(value as unknown, acc);
    }
  }
}

export async function indexPages(filePath: string, config: AppConfig): Promise<Chunk[]> {
  const stat = await fs.stat(filePath);
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  let xmlContent = "";
  let partial = false;

  for (const entry of entries) {
    denyTraversal(entry.entryName);
    if (entry.entryName.endsWith("index.xml")) {
      xmlContent = entry.getData().toString("utf8");
      break;
    }
  }

  if (!xmlContent) {
    partial = true;
    logger.warn("pages-partial", { path: filePath });
    const xmlEntry = entries.find((entry) => entry.entryName.endsWith(".iwa"));
    if (xmlEntry) {
      try {
        const data = xmlEntry.getData().toString("utf8");
        xmlContent = data;
      } catch (err) {
        logger.warn("pages-iwa-read-failed", { path: filePath, error: (err as Error).message });
      }
    }
  }

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = xmlContent ? parser.parse(xmlContent) : {};
  const acc: string[] = [];
  extractStrings(parsed, acc);
  const text = acc.join("\n\n");

  return chunkText(text, {
    path: normalizeForIndex(filePath),
    type: "pages",
    mtime: stat.mtimeMs,
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    partial,
  });
}
