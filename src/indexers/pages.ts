import { promises as fs } from "fs";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { IndexFileResult } from "../types.js";
import { ChunkOptions, chunkSource } from "../pipeline/chunk.js";
import { logger } from "../utils/logger.js";
import { hashBuffer } from "../utils/hash.js";

function flattenText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => flattenText(item)).join(" ");
  }
  if (typeof node === "object") {
    return Object.values(node)
      .map((value) => flattenText(value))
      .join(" ");
  }
  return "";
}

export async function indexPages(filePath: string, mtime: number, options: ChunkOptions): Promise<IndexFileResult> {
  const buffer = await fs.readFile(filePath);
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  let text = "";
  let partial = false;

  const indexEntry = entries.find((entry) => entry.entryName.endsWith("index.xml") || entry.entryName.endsWith("index.apxl"));

  if (indexEntry) {
    const xml = indexEntry.getData().toString("utf8");
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    text = flattenText(parsed).replace(/\s+/g, " ").trim();
  } else {
    const iwaEntries = entries.filter((entry) => entry.entryName.endsWith(".iwa"));
    if (iwaEntries.length > 0) {
      partial = true;
      logger.warn("pages-iwa-unparsed", { path: filePath, entries: iwaEntries.length });
    }
  }

  const chunks = chunkSource({ path: filePath, type: "pages", text, mtime, partial }, options);
  const fileHash = hashBuffer(buffer);
  return { chunks, fullText: text, partial, fileHash };
}
