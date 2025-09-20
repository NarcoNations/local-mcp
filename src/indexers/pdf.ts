import { promises as fs } from "node:fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { shouldRunOcr } from "../pipeline/detect-ocr.js";
import { chunkText } from "../pipeline/chunk.js";
import type { AppConfig, Chunk } from "../types.js";
import { normalizeForIndex } from "../utils/fs-guard.js";
import { logger } from "../utils/logger.js";

export async function indexPdf(filePath: string, config: AppConfig): Promise<Chunk[]> {
  const stat = await fs.stat(filePath);
  const maxBytes = (config.index.maxFileSizeMB ?? 200) * 1024 * 1024;
  if (stat.size > maxBytes) {
    logger.warn("pdf-too-large", { path: filePath, size: stat.size });
    return [];
  }

  const buffer = await fs.readFile(filePath);
  const pages: string[] = [];
  await pdf(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      pages[pageData.pageNumber - 1] = pageText;
      return pageText;
    },
  });

  const fileChunks: Chunk[] = [];
  const normalizedPath = normalizeForIndex(filePath);
  pages.forEach((pageText, idx) => {
    const pageNumber = idx + 1;
    let text = pageText || "";
    if (config.index.ocrEnabled && shouldRunOcr(text, config.index.ocrTriggerMinChars)) {
      logger.warn("pdf-ocr-skipped", { path: filePath, page: pageNumber });
    }
    const chunks = chunkText(text, {
      path: normalizedPath,
      type: "pdf",
      page: pageNumber,
      mtime: stat.mtimeMs,
      chunkSize: config.index.chunkSize,
      chunkOverlap: config.index.chunkOverlap,
    });
    fileChunks.push(...chunks);
  });

  return fileChunks;
}
