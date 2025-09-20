import { promises as fs } from "fs";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { AppConfig } from "../config.js";
import { buildChunks } from "../pipeline/chunk.js";
import { shouldRunOcr } from "../pipeline/detect-ocr.js";
import { warn, info } from "../utils/logger.js";

interface PagerenderPageData {
  getTextContent: () => Promise<{ items: { str: string }[] }>;
}

async function extractPageText(pageData: PagerenderPageData): Promise<string> {
  const content = await pageData.getTextContent();
  return content.items.map((item) => item.str).join(" ");
}

export async function indexPdf(path: string, config: AppConfig, mtime: number) {
  const buffer = await fs.readFile(path);
  const pageTexts: string[] = [];
  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: PagerenderPageData) => {
        const text = await extractPageText(pageData);
        pageTexts.push(text);
        return text;
      },
      max: 0,
      version: "default"
    });
  } catch (error) {
    const message = (error as Error).message || "unknown";
    if (/password/i.test(message) || /encrypted/i.test(message)) {
      warn("pdf-skip-encrypted", { path });
      return [];
    }
    throw error;
  }

  const chunks = [] as ReturnType<typeof buildChunks>;
  pageTexts.forEach((pageText, index) => {
    const needsOcr = config.index.ocrEnabled && shouldRunOcr({ text: pageText, minChars: config.index.ocrTriggerMinChars });
    let text = pageText;
    let partial = false;
    if (needsOcr) {
      partial = true;
      info("pdf-ocr-fallback", { path, page: index + 1 });
      // OCR fallback placeholder: actual image OCR requires PDF rendering; mark partial for traceability.
    }
    const pageChunks = buildChunks(text, {
      path,
      type: "pdf",
      page: index + 1,
      chunkSize: config.index.chunkSize,
      chunkOverlap: config.index.chunkOverlap,
      partial,
      mtime
    });
    chunks.push(...pageChunks);
  });
  return chunks;
}
