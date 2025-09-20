import { promises as fs } from "fs";
import path from "path";
import { RootsConfig } from "../config.js";
import { warn } from "./logger.js";

const SEP = path.sep;

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function globToRegExp(pattern: string): RegExp {
  const posixPattern = toPosix(pattern);
  let result = "";
  for (let i = 0; i < posixPattern.length; i += 1) {
    const char = posixPattern[i];
    if (char === "*") {
      if (posixPattern[i + 1] === "*") {
        result += ".*";
        i += 1;
      } else {
        result += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      result += "[^/]";
      continue;
    }
    const specials = ".+^${}()|[]\\";
    if (specials.includes(char)) {
      result += `\\${char}`;
      continue;
    }
    result += char;
  }
  return new RegExp(`^${result}$`);
}

export class FSGuard {
  private readonly roots: { configured: string; absolute: string; real: string }[] = [];
  private readonly includeExt: Set<string>;
  private readonly excludePatterns: RegExp[];

  private constructor(roots: { configured: string; absolute: string; real: string }[], include: string[], exclude: string[]) {
    this.roots = roots;
    this.includeExt = new Set(include.map((ext) => ext.toLowerCase()));
    this.excludePatterns = exclude.map((pattern) => globToRegExp(pattern));
  }

  static async create(config: RootsConfig): Promise<FSGuard> {
    const roots: { configured: string; absolute: string; real: string }[] = [];
    for (const configured of config.roots) {
      const absolute = path.resolve(configured);
      let real = absolute;
      try {
        real = await fs.realpath(absolute);
      } catch {
        // root might not exist yet; create lazily
        await fs.mkdir(absolute, { recursive: true });
        real = await fs.realpath(absolute);
      }
      roots.push({ configured, absolute, real });
    }
    return new FSGuard(roots, config.include, config.exclude);
  }

  getRoots(): string[] {
    return this.roots.map((r) => r.real);
  }

  private matchesExclude(candidate: string): boolean {
    const rel = toPosix(candidate);
    return this.excludePatterns.some((pattern) => pattern.test(rel));
  }

  private extensionAllowed(candidate: string): boolean {
    const ext = path.extname(candidate).toLowerCase();
    return this.includeExt.has(ext);
  }

  async resolvePath(candidate: string, options: { mustExist?: boolean } = {}): Promise<string> {
    const absCandidate = path.resolve(candidate);
    const root = this.roots.find((r) => {
      const rel = path.relative(r.real, absCandidate);
      return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    });
    if (!root) {
      throw new Error(`Path ${candidate} is outside configured roots`);
    }
    if (options.mustExist) {
      await fs.access(absCandidate).catch(() => {
        throw new Error(`Path ${candidate} does not exist`);
      });
    }
    const realPath = await fs.realpath(absCandidate).catch(() => absCandidate);
    const rel = path.relative(root.real, realPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(`Resolved path escapes root: ${candidate}`);
    }
    await this.assertNoSymlinkEscape(realPath, root.real);
    return realPath;
  }

  private async assertNoSymlinkEscape(target: string, root: string): Promise<void> {
    const rel = path.relative(root, target);
    if (rel.startsWith("..")) {
      throw new Error(`Path ${target} escapes root ${root}`);
    }
    const parts = rel.split(SEP).filter(Boolean);
    let current = root;
    for (const part of parts) {
      current = path.join(current, part);
      try {
        const stat = await fs.lstat(current);
        if (stat.isSymbolicLink()) {
          const resolved = await fs.realpath(current).catch(() => current);
          if (!resolved.startsWith(root)) {
            throw new Error(`Symlink ${current} resolves outside root ${root}`);
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          break;
        }
      }
    }
  }

  isAllowedFile(candidate: string): boolean {
    const normalized = toPosix(candidate);
    if (this.matchesExclude(normalized)) {
      return false;
    }
    if (!this.extensionAllowed(candidate)) {
      return false;
    }
    return true;
  }

  filterAllowed(files: string[]): string[] {
    return files.filter((file) => {
      try {
        const allowed = this.isAllowedFile(file);
        if (!allowed) return false;
        return this.roots.some((root) => {
          const rel = path.relative(root.real, path.resolve(file));
          return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
        });
      } catch (error) {
        warn("path-filter-error", { file, error: (error as Error).message });
        return false;
      }
    });
  }
}
