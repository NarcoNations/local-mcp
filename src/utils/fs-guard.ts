import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface RootsGuardConfig {
  roots: string[];
}

export interface GuardedPath {
  absolute: string;
  relative: string;
}

async function normalizeRoot(rootPath: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), rootPath);
  try {
    return await fs.realpath(resolved);
  } catch {
    return resolved;
  }
}

export async function prepareRoots(config: RootsGuardConfig): Promise<string[]> {
  const results: string[] = [];
  for (const root of config.roots) {
    results.push(await normalizeRoot(root));
  }
  return results;
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

export async function guardPath(p: string, roots: string[]): Promise<GuardedPath> {
  const abs = path.resolve(process.cwd(), p);
  const real = await fs.realpath(abs).catch(() => abs);
  for (const root of roots) {
    const resRoot = await fs.realpath(root).catch(() => root);
    const relative = path.relative(resRoot, real);
    if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
      const repoRelative = path.relative(process.cwd(), real);
      return { absolute: real, relative: toPosix(repoRelative) };
    }
  }
  throw new Error(`Path ${p} is outside of configured roots`);
}

export async function ensureNotSymlink(p: string): Promise<void> {
  const stat = await fs.lstat(p);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinks are not allowed: ${p}`);
  }
}

export async function ensureFileWithinRoots(p: string, roots: string[]): Promise<GuardedPath> {
  const guarded = await guardPath(p, roots);
  await ensureNotSymlink(guarded.absolute);
  return guarded;
}

export function filePathFromUrl(url: string): string {
  return fileURLToPath(new URL(url));
}
