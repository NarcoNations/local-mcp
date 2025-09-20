import { promises as fs } from "fs";
import pdfParse from "pdf-parse";
import { chunkText } from "../pipeline/chunk.js";
import { shouldRunOcr } from "../pipeline/detect-ocr.js";
import { Chunk } from "../types.js";
import { createLogger } from "../utils/logger.js";
import { IndexerArgs } from "./types.js";

const logger = createLogger("pdf");

type PdfPage = {
  getTextContent: (options?: { normalizeWhitespace?: boolean }) => Promise<{ items: Array<{ str?: string }> }>;
};

export async function indexPdf({ filePath, mtime, config }: IndexerArgs): Promise<Chunk[]> {
  const buffer = await fs.readFile(filePath);
  const pageTexts: string[] = [];

  await pdfParse(buffer, {
    pagerender: async (pageData: PdfPage) => {
      const textContent = await pageData.getTextContent({ normalizeWhitespace: true });
      const strings = textContent.items.map((item: { str?: string }) => item.str ?? "").join(" ");
      pageTexts.push(strings);
      return strings;
    },
  });

  if (!pageTexts.length) {
    logger.warn("pdf_no_pages", { file: filePath });
    return [];
  }

  const chunks: Chunk[] = [];
  pageTexts.forEach((pageText, index) => {
    const needsOcr = shouldRunOcr(pageText, config.index);
    if (needsOcr) {
      logger.warn("pdf_ocr_not_implemented", { file: filePath, page: index + 1 });
    }
    const pageChunks = chunkText(pageText, {
      path: filePath,
      type: "pdf",
      page: index + 1,
      size: config.index.chunkSize,
      overlap: config.index.chunkOverlap,
      mtime,
      partial: needsOcr,
    });
    chunks.push(...pageChunks);
  });

  return chunks;
}
