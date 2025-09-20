import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { chunkDocument } from "../pipeline/chunk.js";
import type { Chunk } from "../types.js";
import type { IndexConfig } from "../config.js";
import { logger } from "../utils/logger.js";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", textNodeName: "value" });

function collectStrings(node: any, acc: string[]): void {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed) acc.push(trimmed);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectStrings(item, acc));
    return;
  }
  if (typeof node === "object") {
    for (const value of Object.values(node)) {
      collectStrings(value, acc);
    }
  }
}

export async function indexPages(filePath: string, mtime: number, cfg: IndexConfig): Promise<Chunk[]> {
  let zip: AdmZip;
  try {
    zip = new AdmZip(filePath);
  } catch (err) {
    logger.error("pages-zip-open-failed", { path: filePath, err: String(err) });
    return [];
  }

  const entries = zip.getEntries();
  let xmlContent = "";
  for (const entry of entries) {
    const name = entry.entryName;
    if (!name || name.includes("..") || name.startsWith("/")) {
      logger.warn("pages-zip-entry-skipped", { path: filePath, entry: name });
      continue;
    }
    if (name.endsWith("index.xml")) {
      xmlContent = entry.getData().toString("utf8");
      break;
    }
  }

  let text = "";
  let partial = false;

  if (xmlContent) {
    try {
      const data = parser.parse(xmlContent);
      const segments: string[] = [];
      collectStrings(data, segments);
      text = segments.join("\n\n");
    } catch (err) {
      logger.error("pages-xml-parse-failed", { path: filePath, err: String(err) });
      partial = true;
    }
  } else {
    logger.warn("pages-index-xml-missing", { path: filePath });
    partial = true;
  }

  if (!text) {
    text = "";
  }

  const chunks = chunkDocument({
    path: filePath,
    type: "pages",
    text,
    mtime,
    partial,
    chunkSize: cfg.chunkSize,
    chunkOverlap: cfg.chunkOverlap,
  });

  if (chunks.length === 0) {
    partial = true;
  }

  return chunks.map((chunk) => ({ ...chunk, partial: chunk.partial || partial }));
}
