import { promises as fs } from "node:fs";
import path from "node:path";

export async function realpathSafe(p: string): Promise<string> {
  const real = await fs.realpath(p);
  const stat = await fs.lstat(real);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinks are not permitted: ${p}`);
  }
  return real;
}

export function isWithinRoots(target: string, roots: string[]): boolean {
  const normalized = path.resolve(target);
  return roots.some((root) => {
    const resolvedRoot = path.resolve(root);
    return normalized === resolvedRoot || normalized.startsWith(`${resolvedRoot}${path.sep}`);
  });
}

export function assertWithinRoots(target: string, roots: string[]): void {
  if (!isWithinRoots(target, roots)) {
    throw new Error(`Path ${target} is outside configured roots.`);
  }
}

export function normalizeForIndex(target: string): string {
  const relative = path.relative(process.cwd(), path.resolve(target));
  return relative.split(path.sep).join(path.posix.sep);
}

export function denyTraversal(entryPath: string): void {
  if (entryPath.includes("..") || path.isAbsolute(entryPath)) {
    throw new Error(`Unsafe archive entry path detected: ${entryPath}`);
  }
}
