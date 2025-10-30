import matter from 'gray-matter';

/**
 * Merges a front‑matter patch into an existing Markdown string.
 * If no front‑matter exists, a new block is added.
 */
export function mergeFrontmatter(md: string, patch: Record<string, any>): string {
  const parsed = matter(md);
  const data = { ...parsed.data, ...patch };
  // gray-matter will handle serialising to YAML and reinserting the block
  return matter.stringify(parsed.content.trimStart(), data, { language: 'yaml' });
}

/** Build a simple patch from an md-convert manifest */
export function patchFromManifest(manifest: any) {
  if (!manifest) return {};
  return {
    id: manifest.id,
    title: manifest.title,
    slug: manifest.slug,
    source: {
      filename: manifest.source?.filename,
      ext: manifest.source?.ext,
      sha256: manifest.source?.sha256,
      origin: manifest.source?.origin || 'upload'
    },
    content_type: 'text/markdown',
    tags: manifest.tags || [],
    provenance: {
      extractors: manifest.provenance?.extractors || [],
      converted_at: manifest.provenance?.converted_at
    }
  };
}
