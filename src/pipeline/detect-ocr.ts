import { IndexConfig } from "../config.js";

export interface OcrDecision {
  shouldRun: boolean;
  reason: string;
}

export function shouldRunOcr(text: string, config: IndexConfig): OcrDecision {
  if (!config.ocrEnabled) {
    return { shouldRun: false, reason: "ocr-disabled" };
  }
  const length = text.replace(/\s+/g, "").length;
  if (length >= config.ocrTriggerMinChars) {
    return { shouldRun: false, reason: "enough-text" };
  }
  return { shouldRun: true, reason: "low-density" };
}
