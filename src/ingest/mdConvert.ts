import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";
import matter from "gray-matter";
import { AppConfig } from "../config.js";
import { ensureWithinRoots } from "../utils/fs-guard.js";
import { logger } from "../utils/logger.js";
import { getStore } from "../store/store.js";

export type MdConvertOrigin = "upload" | "email" | "url" | "drop";

export interface MdConvertOptions {
  path: string;
  tags?: string[];
  origin?: MdConvertOrigin;
  outDir?: string;
  reindex?: boolean;
}

export interface MdConvertResult {
  slug: string;
  title: string;
  markdownPath: string;
  manifestPath: string | null;
  assets: string[];
  filesWritten: number;
  indexed?: number;
  updated?: number;
}

interface ManifestShape {
  id?: string;
  slug?: string;
  title?: string;
  tags?: string[];
  source?: {
    filename?: string;
    ext?: string;
    sha256?: string;
    origin?: string;
  };
  provenance?: {
    extractors?: string[];
    converted_at?: string;
  };
}

function normaliseTags(...groups: (string[] | undefined)[]): string[] | undefined {
  const set = new Set<string>();
  for (const group of groups) {
    if (!group) continue;
    for (const value of group) {
      const trimmed = value.trim();
      if (trimmed) {
        set.add(trimmed);
      }
    }
  }
  return set.size ? Array.from(set) : undefined;
}

function enrichManifest(manifest: ManifestShape | null, tags?: string[], origin?: string): ManifestShape | null {
  if (!manifest && !tags && !origin) {
    return manifest;
  }
  const base = manifest ? (JSON.parse(JSON.stringify(manifest)) as ManifestShape) : {};
  const combinedTags = normaliseTags(base.tags, tags);
  if (combinedTags) {
    base.tags = combinedTags;
  }
  if (origin) {
    base.source = { ...(base.source ?? {}), origin };
  }
  return base;
}

function applyFrontmatter(content: string, manifest: ManifestShape | null, tags?: string[], origin?: string): string {
  const parsed = matter(content);
  const data = { ...parsed.data } as Record<string, unknown>;

  if (manifest?.id) data.id = manifest.id;
  if (manifest?.title) data.title = manifest.title;
  if (manifest?.slug) data.slug = manifest.slug;
  const combinedTags = normaliseTags(Array.isArray(data.tags) ? (data.tags as string[]) : undefined, manifest?.tags, tags);
  if (combinedTags) {
    data.tags = combinedTags;
  }
  const source: Record<string, unknown> = {
    ...(typeof data.source === "object" && data.source !== null ? (data.source as Record<string, unknown>) : {}),
    ...(manifest?.source ?? {}),
  };
  if (origin) {
    source.origin = origin;
  }
  if (Object.keys(source).length) {
    data.source = source;
  }
  const provenance: Record<string, unknown> = {
    ...(typeof data.provenance === "object" && data.provenance !== null
      ? (data.provenance as Record<string, unknown>)
      : {}),
    ...(manifest?.provenance ?? {}),
  };
  if (Object.keys(provenance).length) {
    data.provenance = provenance;
  }
  if (!data.content_type) {
    data.content_type = "text/markdown";
  }

  const trimmed = parsed.content.replace(/^\s+/, "");
  return matter.stringify(trimmed, data);
}

function resolveEndpoint(): string {
  const env = process.env.MD_CONVERT_URL;
  if (!env) {
    throw new Error("Set MD_CONVERT_URL before using md-convert integration");
  }
  return env.endsWith("/convert") ? env : `${env.replace(/\/$/, "")}/convert`;
}

export async function convertWithMdWorker(config: AppConfig, options: MdConvertOptions): Promise<MdConvertResult> {
  const { path: targetPath, tags, origin, outDir, reindex = true } = options;
  const sourcePath = await ensureWithinRoots(config.roots.roots, targetPath);
  const fileBuffer = await fs.readFile(sourcePath);
  const endpoint = resolveEndpoint();
  const form = new FormData();
  const fileArray = new Uint8Array(fileBuffer.length);
  fileArray.set(fileBuffer);
  form.append("file", new Blob([fileArray.buffer]), path.basename(sourcePath));
  if (tags?.length) {
    form.append("tags", tags.join(","));
  }
  if (origin) {
    form.append("origin", origin);
  }

  const response = await fetch(endpoint, { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(`md-convert failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  if (!entries.length) {
    throw new Error("md-convert returned an empty archive");
  }

  let manifest: ManifestShape | null = null;
  for (const entry of entries) {
    if (entry.entryName.endsWith("manifest.json")) {
      try {
        manifest = JSON.parse(entry.getData().toString("utf8")) as ManifestShape;
      } catch (err) {
        logger.warn("md-convert-manifest-parse-failed", { err: String(err) });
      }
      break;
    }
  }

  const slug = manifest?.slug ?? path.parse(path.basename(sourcePath)).name;
  const title = manifest?.title ?? slug;
  const relativeOut = outDir ?? path.join("docs", "md-convert", slug);
  const absoluteOut = path.resolve(process.cwd(), relativeOut);
  await fs.mkdir(absoluteOut, { recursive: true });

  const enrichedManifest = enrichManifest(manifest, tags, origin);

  let markdownPath: string | null = null;
  let manifestPath: string | null = null;
  const assetPaths: string[] = [];
  let filesWritten = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const raw = entry.getData();
    const parts = entry.entryName.split("/");
    const relativeParts = parts.length > 1 ? parts.slice(1) : parts;
    const target = path.join(absoluteOut, ...relativeParts);
    await fs.mkdir(path.dirname(target), { recursive: true });

    if (entry.entryName.endsWith("manifest.json")) {
      const manifestContent = JSON.stringify(enrichedManifest ?? JSON.parse(raw.toString("utf8")), null, 2);
      await fs.writeFile(target, manifestContent, "utf8");
      manifestPath = target;
      filesWritten++;
      continue;
    }

    if (entry.entryName.endsWith(".md")) {
      const patched = applyFrontmatter(raw.toString("utf8"), enrichedManifest, tags, origin);
      await fs.writeFile(target, patched, "utf8");
      markdownPath = target;
      filesWritten++;
      continue;
    }

    await fs.writeFile(target, raw);
    filesWritten++;
    if (target.includes(`${path.sep}assets${path.sep}`)) {
      assetPaths.push(target);
    }
  }

  if (!markdownPath) {
    throw new Error("md-convert archive did not include a markdown file");
  }

  let stats: { indexed: number; updated: number; skipped: number } | null = null;
  if (reindex) {
    const store = await getStore(config);
    stats = await store.reindex([absoluteOut]);
  }

  logger.info("md-convert-completed", {
    slug,
    title,
    markdownPath,
    manifestPath,
    filesWritten,
    indexed: stats?.indexed,
  });

  return {
    slug,
    title,
    markdownPath: path.relative(process.cwd(), markdownPath),
    manifestPath: manifestPath ? path.relative(process.cwd(), manifestPath) : null,
    assets: assetPaths.map((asset) => path.relative(process.cwd(), asset)),
    filesWritten,
    indexed: stats?.indexed,
    updated: stats?.updated,
  };
}
