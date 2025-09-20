import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { AppConfig } from "../config.js";
import { buildChunks } from "../pipeline/chunk.js";
import { warn } from "../utils/logger.js";

function isSafeEntry(name: string): boolean {
  return !name.startsWith("/") && !name.includes(".." + "/");
}

function extractText(node: any, acc: string[]): void {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    acc.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) extractText(child, acc);
    return;
  }
  if (typeof node === "object") {
    for (const value of Object.values(node)) {
      extractText(value, acc);
    }
  }
}

export async function indexPages(path: string, config: AppConfig, mtime: number) {
  const zip = new AdmZip(path);
  const entries = zip.getEntries().filter((entry) => isSafeEntry(entry.entryName));
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });
  let text = "";
  let partial = false;
  const indexEntry = entries.find((entry) => entry.entryName.endsWith("index.xml"));
  if (indexEntry) {
    const xml = indexEntry.getData().toString("utf8");
    const parsed = parser.parse(xml);
    const buffer: string[] = [];
    extractText(parsed, buffer);
    text = buffer.join("\n");
  } else {
    // Attempt to sniff .iwa entries for text fragments
    let foundText = false;
    for (const entry of entries.filter((e) => e.entryName.endsWith(".iwa"))) {
      try {
        const data = entry.getData().toString("utf8");
        if (/<\/?[a-zA-Z]/.test(data)) {
          const parsed = parser.parse(data);
          const buffer: string[] = [];
          extractText(parsed, buffer);
          if (buffer.length) {
            foundText = true;
            text += buffer.join("\n") + "\n";
          }
        }
      } catch (error) {
        partial = true;
        warn("pages-iwa-skip", { path, entry: entry.entryName, error: (error as Error).message });
      }
    }
    if (!foundText) {
      partial = true;
      warn("pages-partial", { path, reason: "unparsable" });
    }
  }
  return buildChunks(text, {
    path,
    type: "pages",
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
    partial,
    mtime
  });
}
