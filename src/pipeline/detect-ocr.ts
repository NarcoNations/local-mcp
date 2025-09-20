export function shouldRunOcr(text: string, minChars: number): boolean {
  const cleaned = text.replace(/\s+/g, "");
  return cleaned.length < minChars;
}
