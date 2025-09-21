import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import pdfParse from "pdf-parse";
import type { ImportContext, ImportResult, Section } from "./types.js";
import { buildContentHash } from "./utils.js";

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

export async function importPages(context: ImportContext): Promise<ImportResult[]> {
  let zip: AdmZip;
  try {
    zip = new AdmZip(context.filePath);
  } catch (error) {
    return [];
  }

  const previewEntry = zip.getEntry("QuickLook/Preview.pdf");
  if (previewEntry) {
    const buffer = previewEntry.getData();
    const sections: Section[] = [];
    await pdfParse(buffer, {
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        const strings = textContent.items.map((item: any) => ("str" in item ? item.str : ""));
        const text = strings.join(" ").replace(/\s+/g, " ").trim();
        if (text) {
          sections.push({ text, page: pageData.pageNumber, order: sections.length });
        }
        return text;
      },
    });

    if (sections.length === 0) return [];

    const documentMeta = {
      title: context.filePath.split("/").pop() ?? context.filePath,
      pathOrUri: context.filePath,
      contentType: "pages",
      meta: { extraction: "preview_pdf" },
    } as const;

    return [{
      source: { kind: "file", origin: context.filePath },
      document: documentMeta,
      sections,
      contentHash: buildContentHash(sections, documentMeta),
    }];
  }

  const indexEntry = zip.getEntry("index.xml");
  if (!indexEntry) {
    return [];
  }
  try {
    const content = indexEntry.getData().toString("utf8");
    const parsed = xmlParser.parse(content);
    const segments: string[] = [];
    collectStrings(parsed, segments);
    const text = segments.join("\n\n");
    if (!text.trim()) return [];
    const sections: Section[] = [{ heading: undefined, text, order: 0 }];
    const documentMeta = {
      title: context.filePath.split("/").pop() ?? context.filePath,
      pathOrUri: context.filePath,
      contentType: "pages",
      meta: { extraction: "index_xml" },
    } as const;
    return [{
      source: { kind: "file", origin: context.filePath },
      document: documentMeta,
      sections,
      contentHash: buildContentHash(sections, documentMeta),
    }];
  } catch (error) {
    return [];
  }
}

function collectStrings(node: unknown, acc: string[]): void {
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
    Object.values(node as Record<string, unknown>).forEach((value) => collectStrings(value, acc));
  }
}
