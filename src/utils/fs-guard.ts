import { promises as fs } from "fs";
import path from "path";
import { RootsConfig } from "../config.js";

export async function realpathSafe(target: string): Promise<string> {
  const abs = path.resolve(target);
  const real = await fs.realpath(abs);
  return real;
}

export function withinRoots(real: string, roots: string[]): boolean {
  return roots.some((root) => {
    const resolvedRoot = path.resolve(root);
    const relative = path.relative(resolvedRoot, real);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  });
}

export async function ensureWithinRoots(target: string, config: RootsConfig): Promise<string> {
  const real = await realpathSafe(target);
  if (!withinRoots(real, config.roots)) {
    throw new Error(`Path ${target} is outside configured roots`);
  }
  return real;
}

export async function safeStat(target: string, config: RootsConfig) {
  const real = await ensureWithinRoots(target, config);
  return { real, stat: await fs.stat(real) };
}

export function matchesInclude(file: string, include: string[]): boolean {
  return include.some((ext) => file.toLowerCase().endsWith(ext.toLowerCase()));
}

export function matchesExclude(file: string, exclude: string[]): boolean {
  return exclude.some((pattern) => {
    const normalized = pattern.replace(/\*\*\//g, "");
    return file.includes(normalized.replace(/\*/g, ""));
  });
}
