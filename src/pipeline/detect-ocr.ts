export function shouldRunOCR(pageText: string, threshold: number): boolean {
  const clean = pageText.replace(/\s+/g, "").trim();
  return clean.length < threshold;
}
