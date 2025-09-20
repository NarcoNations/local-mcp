import { promises as fs } from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { IndexConfig } from "../config.js";
import { IndexFileResult } from "../types.js";
import { ChunkOptions, chunkSource } from "../pipeline/chunk.js";
import { shouldRunOcr } from "../pipeline/detect-ocr.js";
import { logger } from "../utils/logger.js";
import { hashBuffer } from "../utils/hash.js";

export async function indexPdf(
  filePath: string,
  mtime: number,
  options: ChunkOptions,
  config: IndexConfig,
): Promise<IndexFileResult> {
  const buffer = await fs.readFile(filePath);
  const pageTexts: string[] = [];
  const parsed = await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((item: any) => item.str || "").join("\n");
      pageTexts.push(text);
      return text;
    },
  });

  if (pageTexts.length === 0 && parsed.text) {
    pageTexts.push(parsed.text);
  }

  const chunks = pageTexts.flatMap((text, idx) => {
    const decision = shouldRunOcr(text, config);
    const needsOcr = decision.shouldRun;
    if (needsOcr) {
      logger.warn("pdf-ocr-fallback-unavailable", { path: filePath, page: idx + 1, reason: decision.reason });
    }
    return chunkSource(
      {
        path: filePath,
        type: "pdf",
        text,
        mtime,
        page: idx + 1,
        partial: needsOcr,
      },
      options,
    );
  });

  const partial = chunks.some((chunk) => chunk.partial);

  const fileHash = hashBuffer(buffer);
  return { chunks, pages: pageTexts, partial, fileHash };
}
