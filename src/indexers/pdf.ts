import { promises as fs } from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { chunkText } from "../pipeline/chunk.js";
import { shouldRunOCR } from "../pipeline/detect-ocr.js";
import { chunkId } from "../utils/hash.js";
import { IndexContext, IndexResult } from "./types.js";
import { logger } from "../utils/logger.js";

export async function extractPdfPages(absolutePath: string): Promise<string[]> {
  const buffer = await fs.readFile(absolutePath);
  const pageTexts: string[] = [];
  await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent({ normalizeWhitespace: true });
      const pageText = textContent.items.map((item: any) => item.str).join(" \n");
      pageTexts.push(pageText);
      return pageText;
    },
  });
  return pageTexts;
}

export const indexPdf = async (context: IndexContext): Promise<IndexResult> => {
  const { absolutePath, relativePath, config, mtime } = context;
  const warnings: string[] = [];
  let pageTexts: string[] = [];
  try {
    pageTexts = await extractPdfPages(absolutePath);
  } catch (err: any) {
    warnings.push(`pdf-parse-failed: ${err.message}`);
    logger.warn("pdf-parse-failed", { path: relativePath, error: err.message });
  }

  let partial = false;
  const chunks = pageTexts.flatMap((pageText, pageIndex) => {
    const trimmed = pageText.trim();
    if (!trimmed.length) {
      partial = true;
      return [];
    }
    if (config.index.ocrEnabled && shouldRunOCR(trimmed, config.index.ocrTriggerMinChars)) {
      warnings.push(`ocr-suggested-page-${pageIndex + 1}`);
      partial = true;
    }
    const fragments = chunkText(trimmed, {
      chunkSize: config.index.chunkSize,
      chunkOverlap: config.index.chunkOverlap,
    });
    return fragments.map((fragment) => ({
      id: chunkId(`${relativePath}#${pageIndex + 1}`, pageIndex + 1, fragment.start),
      path: relativePath,
      type: "pdf" as const,
      page: pageIndex + 1,
      offsetStart: fragment.start,
      offsetEnd: fragment.end,
      text: fragment.text,
      mtime,
    }));
  });

  return { chunks, warnings, partial };
};
