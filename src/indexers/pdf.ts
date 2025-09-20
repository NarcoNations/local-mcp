import { promises as fs } from "fs";
import pdfParse from "pdf-parse";
import type { IndexConfig } from "../config.js";
import type { Chunk } from "../types.js";
import { chunkDocument } from "../pipeline/chunk.js";
import { shouldRunOCR } from "../pipeline/detect-ocr.js";
import { logger } from "../utils/logger.js";

export async function indexPdf(filePath: string, mtime: number, cfg: IndexConfig): Promise<Chunk[]> {
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (err) {
    logger.error("pdf-read-failed", { path: filePath, err: String(err) });
    return [];
  }

  const pages: string[] = [];
  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        const strings = textContent.items.map((item: any) => ("str" in item ? item.str : ""));
        const text = strings.join(" ");
        pages.push(text);
        return text;
      },
      disableCombineTextItems: false,
    });
  } catch (err: any) {
    if (/password/i.test(String(err))) {
      logger.warn("pdf-encrypted", { path: filePath });
      return [];
    }
    logger.error("pdf-parse-failed", { path: filePath, err: String(err) });
    return [];
  }

  const chunks: Chunk[] = [];
  pages.forEach((text, idx) => {
    let pageText = text;
    let partial = false;
    if (cfg.ocrEnabled && shouldRunOCR(pageText, cfg.ocrTriggerMinChars)) {
      logger.warn("pdf-ocr-unavailable", { path: filePath, page: idx + 1 });
      partial = true;
    }
    const pageChunks = chunkDocument({
      path: filePath,
      type: "pdf",
      text: pageText,
      page: idx + 1,
      mtime,
      partial,
      chunkSize: cfg.chunkSize,
      chunkOverlap: cfg.chunkOverlap,
    });
    chunks.push(...pageChunks);
  });

  return chunks;
}
