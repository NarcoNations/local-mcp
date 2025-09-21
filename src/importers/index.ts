import path from "node:path";
import type { ImportContext, ImportResult } from "./types.js";
import { importMarkdown } from "./markdown.js";
import { importPlainText } from "./text.js";
import { importDocx } from "./docx.js";
import { importPdf } from "./pdf.js";
import { importPages } from "./pages.js";
import { importJson } from "./json.js";
import { importJsonl } from "./jsonl.js";
import { importCsvNodes } from "./csvNodes.js";

const IMPORTERS: Record<string, (ctx: ImportContext) => Promise<ImportResult[]>> = {
  ".md": importMarkdown,
  ".markdown": importMarkdown,
  ".txt": importPlainText,
  ".docx": importDocx,
  ".pdf": importPdf,
  ".pages": importPages,
  ".json": importJson,
  ".jsonl": importJsonl,
  ".csv": importCsvNodes,
};

export async function importFile(filePath: string): Promise<ImportResult[]> {
  const ext = path.extname(filePath).toLowerCase();
  const handler = IMPORTERS[ext];
  if (!handler) return [];
  const context: ImportContext = { filePath, now: new Date() };
  return handler(context);
}

export * from "./types.js";
