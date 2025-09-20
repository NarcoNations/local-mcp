export interface OCRDecisionInput {
  text: string;
  minChars: number;
}

export function shouldRunOcr({ text, minChars }: OCRDecisionInput): boolean {
  if (!text) return true;
  const normalized = text.replace(/\s+/g, "");
  return normalized.length < minChars;
}
