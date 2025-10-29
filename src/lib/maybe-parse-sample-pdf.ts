import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";

/**
 * Attempts to parse a sample PDF, but quietly skips if missing.
 * Point to a custom file with SAMPLE_PDF=./path/to/file.pdf
 */
export async function maybeParseSamplePdf(logger: Pick<Console,"log"|"warn"|"error"> = console) {
  const fallback = "./test/data/05-versions-space.pdf";
  const rel = process.env.SAMPLE_PDF ?? fallback;
  const abs = path.resolve(process.cwd(), rel);

  if (!fs.existsSync(abs)) {
    logger.warn(JSON.stringify({ level: "warn", msg: "sample-pdf-missing", path: rel }));
    return null;
  }
  try {
    const buf = fs.readFileSync(abs);
    const out = await pdf(buf);
    logger.log(JSON.stringify({
      level: "info",
      msg: "sample-pdf-parsed",
      path: rel,
      chars: out.text?.length ?? 0,
      preview: out.text?.slice(0,120) ?? ""
    }));
    return out;
  } catch (err) {
    logger.error(JSON.stringify({ level: "error", msg: "sample-pdf-parse-failed", path: rel, err: String(err) }));
    return null;
  }
}
