export function shouldRunOCR(pageText: string, threshold: number): boolean {
  return pageText.replace(/\s+/g, "").length < threshold;
}
