import fs from "node:fs/promises";
import pdfParse from "pdf-parse";
import type { ImportContext, ImportResult, Section } from "./types.js";
import { buildContentHash } from "./utils.js";

export async function importPdf(context: ImportContext): Promise<ImportResult[]> {
  const buffer = await fs.readFile(context.filePath);
  const pages: Section[] = [];
  await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const strings = textContent.items.map((item: any) => ("str" in item ? item.str : ""));
      const text = strings.join(" ").replace(/\s+/g, " ").trim();
      if (text) {
        pages.push({ heading: undefined, text, page: pageData.pageNumber, order: pages.length });
      }
      return text;
    },
    disableCombineTextItems: false,
  });

  if (pages.length === 0) return [];

  const documentMeta = {
    title: context.filePath.split("/").pop() ?? context.filePath,
    pathOrUri: context.filePath,
    contentType: "pdf",
    meta: {},
  } as const;

  return [{
    source: {
      kind: "file",
      origin: context.filePath,
    },
    document: documentMeta,
    sections: pages,
    contentHash: buildContentHash(pages, documentMeta),
  }];
}
