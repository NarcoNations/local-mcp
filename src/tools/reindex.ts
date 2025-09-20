import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";
import { z } from "zod";
import { AppContext } from "../app.js";
import { indexPath } from "../indexers/index.js";
import { sha1 } from "../utils/hash.js";
import { toPosix } from "../utils/fs-guard.js";
import { logger } from "../utils/logger.js";

const InputSchema = z.object({
  paths: z.array(z.string()).optional(),
});

interface ReindexStats {
  indexed: number;
  updated: number;
  skipped: number;
  removed: number;
  warnings: string[];
}

async function hashFile(absolutePath: string): Promise<string> {
  const data = await fs.readFile(absolutePath);
  return sha1(data);
}

async function collectFiles(paths: string[], include: string[], exclude: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const root of paths) {
    const rootResolved = path.resolve(process.cwd(), root);
    const stat = await fs.stat(rootResolved).catch(() => null);
    if (stat?.isFile()) {
      files.push(rootResolved);
      continue;
    }
    if (!stat) {
      continue;
    }
    const patterns = include.map((ext) => `**/*${ext}`);
    try {
      const entries = await fg(patterns, {
        cwd: rootResolved,
        ignore: exclude,
        onlyFiles: true,
        followSymbolicLinks: false,
      });
      for (const entry of entries) {
        const absolute = path.join(rootResolved, entry);
        files.push(absolute);
      }
    } catch (err: any) {
      logger.warn("glob-failed", { path: rootResolved, error: err.message });
    }
  }
  return files;
}

export async function reindex(context: AppContext, input: unknown): Promise<ReindexStats> {
  const { config, store, embedder } = context;
  const { paths } = InputSchema.parse(input ?? {});
  const roots = paths && paths.length ? paths : config.roots.roots;
  const files = await collectFiles(roots, config.roots.include, config.roots.exclude);
  const repoRoot = process.cwd();
  const stats: ReindexStats = { indexed: 0, updated: 0, skipped: 0, removed: 0, warnings: [] };
  const seen = new Set<string>();

  for (const absolutePath of files) {
    const relativePath = toPosix(path.relative(repoRoot, absolutePath));
    seen.add(relativePath);
    const hash = await hashFile(absolutePath);
    const existing = store.getFileRecord(relativePath);
    if (existing && existing.hash === hash) {
      stats.skipped += 1;
      continue;
    }
    const result = await indexPath(absolutePath, relativePath, config);
    if (!result.chunks.length) {
      stats.warnings.push(...result.warnings);
      if (existing) {
        await store.remove(relativePath);
        stats.removed += 1;
      }
      continue;
    }
    const vectors = [];
    for (const chunk of result.chunks) {
      const embedding = await embedder.embedChunk(chunk);
      vectors.push(embedding);
    }
    await store.upsert({
      filePath: relativePath,
      hash,
      chunks: result.chunks,
      vectors,
      partial: result.partial,
    });
    if (existing) {
      stats.updated += 1;
    } else {
      stats.indexed += 1;
    }
    stats.warnings.push(...result.warnings);
  }

  const tracked = store.listFiles();
  for (const pathKey of tracked) {
    if (!seen.has(pathKey)) {
      const absolute = path.resolve(repoRoot, pathKey);
      const exists = await fs.access(absolute).then(() => true).catch(() => false);
      if (!exists) {
        await store.remove(pathKey);
        stats.removed += 1;
      }
    }
  }

  logger.info("reindex-complete", { ...stats });
  return stats;
}
