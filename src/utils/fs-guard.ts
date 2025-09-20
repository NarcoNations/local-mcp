import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";

export async function ensureWithinRoots(roots: string[], candidate: string): Promise<string> {
  const resolved = await fs.realpath(path.resolve(candidate));
  for (const root of roots) {
    const rootReal = await fs.realpath(path.resolve(root));
    if (resolved === rootReal || resolved.startsWith(`${rootReal}${path.sep}`)) {
      return resolved;
    }
  }
  throw new Error(`Path ${candidate} is outside configured roots`);
}

export function filterAllowedExtensions(paths: string[], include: string[]): string[] {
  return paths.filter((p) => include.includes(path.extname(p).toLowerCase()));
}

export async function discoverFiles(roots: string[], include: string[], exclude: string[]): Promise<string[]> {
  const patterns = roots.map((root) => include.map((ext) => `${root.replace(/\\/g, "/")}/**/*${ext}`)).flat();
  const files = await fg(patterns, { ignore: exclude, dot: false, onlyFiles: true, followSymbolicLinks: false });
  return files.map((f) => path.resolve(f));
}

export async function isSymlink(p: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(p);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

export async function safeReadFile(p: string): Promise<Buffer> {
  await ensureNoTraversal(p);
  return fs.readFile(p);
}

async function ensureNoTraversal(filePath: string): Promise<void> {
  const normalized = path.normalize(filePath);
  if (normalized.includes(`..${path.sep}`)) {
    throw new Error(`Path traversal attempt detected for ${filePath}`);
  }
}

export function normaliseSnippet(text: string): string {
  return text
    .replace(/[\r\t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
