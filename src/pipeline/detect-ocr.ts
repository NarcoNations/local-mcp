import { IndexConfig } from "../types.js";

export function shouldRunOcr(pageText: string, config: IndexConfig): boolean {
  if (!config.ocrEnabled) return false;
  const trimmed = pageText.replace(/\s+/g, "");
  return trimmed.length < config.ocrTriggerMinChars;
}
