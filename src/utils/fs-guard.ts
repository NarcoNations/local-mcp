import { promises as fs } from "fs";
import path from "path";
import fastGlob from "fast-glob";
import { RootsConfig } from "../types.js";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function pathStats(target: string) {
  try {
    return await fs.stat(target);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
}

export function normalize(p: string): string {
  return path.normalize(p).replace(/\\/g, "/");
}

export function withinRoots(targetPath: string, roots: string[]): boolean {
  const target = path.resolve(targetPath);
  return roots.some(root => {
    const absRoot = path.resolve(root);
    const rel = path.relative(absRoot, target);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  });
}

export function assertWithinRoots(targetPath: string, roots: string[]): string {
  const target = path.resolve(targetPath);
  const ok = roots.some(root => {
    const absRoot = path.resolve(root);
    const rel = path.relative(absRoot, target);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  });
  if (!ok) {
    throw new Error(`Path ${targetPath} is outside configured roots`);
  }
  return target;
}

export function isAllowedExtension(filePath: string, config: RootsConfig): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return config.include.includes(ext);
}

export async function collectFiles(paths: string[], config: RootsConfig): Promise<string[]> {
  const inputs = paths.length ? paths : config.roots;
  const results: string[] = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    const stats = await pathStats(resolved);
    if (!stats) continue;
    if (stats.isDirectory()) {
      const pattern = path.join(resolved, "**/*");
      const entries = await fastGlob(pattern, {
        dot: false,
        onlyFiles: true,
        caseSensitiveMatch: false,
        followSymbolicLinks: false,
        ignore: config.exclude,
      });
      for (const entry of entries) {
        if (isAllowedExtension(entry, config)) {
          results.push(path.resolve(entry));
        }
      }
    } else if (stats.isFile()) {
      if (isAllowedExtension(resolved, config)) {
        results.push(resolved);
      }
    }
  }
  return Array.from(new Set(results));
}
