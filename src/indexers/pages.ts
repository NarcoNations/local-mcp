import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { chunkText } from "../pipeline/chunk.js";
import { Chunk } from "../types.js";
import { createLogger } from "../utils/logger.js";
import { IndexerArgs } from "./types.js";

const logger = createLogger("pages");

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  trimValues: true,
});

function collectText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).join("\n");
  if (value && typeof value === "object") {
    return Object.values(value)
      .map(collectText)
      .join("\n");
  }
  return "";
}

export async function indexPages({ filePath, mtime, config }: IndexerArgs): Promise<Chunk[]> {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  let xmlText = "";
  let partial = false;

  for (const entry of entries) {
    const name = entry.entryName;
    if (name.includes("..") || name.startsWith("/")) {
      logger.warn("pages_zip_escape_blocked", { file: filePath, entry: name });
      continue;
    }
    if (name.endsWith(".xml")) {
      const content = entry.getData().toString("utf8");
      try {
        const parsed = xmlParser.parse(content);
        xmlText += `\n${collectText(parsed)}`;
      } catch (err) {
        logger.warn("pages_xml_parse_failed", { file: filePath, entry: name, error: String(err) });
      }
    }
  }

  if (!xmlText.trim()) {
    partial = true;
    logger.warn("pages_modern_partial", { file: filePath });
  }

  const text = xmlText.trim();
  if (!text) {
    return chunkText("", {
      path: filePath,
      type: "pages",
      size: config.index.chunkSize,
      overlap: config.index.chunkOverlap,
      mtime,
      partial: true,
    });
  }

  return chunkText(text, {
    path: filePath,
    type: "pages",
    size: config.index.chunkSize,
    overlap: config.index.chunkOverlap,
    mtime,
    partial,
  });
}
