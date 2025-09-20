import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { chunkText } from "../pipeline/chunk.js";
import { chunkId } from "../utils/hash.js";
import { IndexContext, IndexResult } from "./types.js";

function isSafeEntry(name: string): boolean {
  return !name.includes("..") && !name.startsWith("/");
}

function extractTextFromXML(xml: string): string {
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, textNodeName: "text" });
  const parsed = parser.parse(xml);
  const texts: string[] = [];

  const walk = (node: any) => {
    if (node == null) return;
    if (typeof node === "string") {
      texts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (typeof node === "object") {
      if (typeof node.text === "string") {
        texts.push(node.text);
      }
      for (const value of Object.values(node)) {
        if (value !== node.text) {
          walk(value);
        }
      }
    }
  };

  walk(parsed);
  return texts.join("\n");
}

export const indexPages = async (context: IndexContext): Promise<IndexResult> => {
  const { absolutePath, relativePath, config, mtime } = context;
  const zip = new AdmZip(absolutePath);
  const warnings: string[] = [];
  let xmlText = "";
  let partial = false;

  for (const entry of zip.getEntries()) {
    if (!isSafeEntry(entry.entryName)) {
      warnings.push(`skipped-unsafe-entry:${entry.entryName}`);
      continue;
    }
    if (entry.entryName.endsWith(".xml") || entry.entryName.endsWith(".apxl")) {
      xmlText = entry.getData().toString("utf8");
      break;
    }
  }

  if (!xmlText) {
    warnings.push("pages-xml-not-found");
    partial = true;
  }

  const text = xmlText ? extractTextFromXML(xmlText) : "";
  const fragments = chunkText(text, {
    chunkSize: config.index.chunkSize,
    chunkOverlap: config.index.chunkOverlap,
  });

  const chunks = fragments.map((fragment, idx) => ({
    id: chunkId(`${relativePath}#${idx}`, idx + 1, fragment.start),
    path: relativePath,
    type: "pages" as const,
    page: idx + 1,
    offsetStart: fragment.start,
    offsetEnd: fragment.end,
    text: fragment.text,
    mtime,
    partial,
  }));

  return { chunks, warnings, partial };
};
