export const runtime = 'nodejs';
import { NextRequest } from 'next/server';

import { getSupabase, uploadBuffer } from '../../../lib/supabase';
import { unzipToMemory } from '../../../lib/unzip';
import { mergeFrontmatter, patchFromManifest } from '../../../lib/frontmatter';
import { upsertKnowledge } from '../../../lib/db';

// Helper to detect simple content-type from filename
function contentTypeFromPath(p: string): string {
  if (p.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json';
  if (p.match(/\.png$/i)) return 'image/png';
  if (p.match(/\.jpe?g$/i)) return 'image/jpeg';
  if (p.match(/\.gif$/i)) return 'image/gif';
  if (p.match(/\.webp$/i)) return 'image/webp';
  return 'application/octet-stream';
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return new Response('Missing "file"', { status: 400 });
    }

    const origin = (form.get('origin') as string) || 'upload';
    const tags = (form.get('tags') as string) || '';

    const worker = process.env.MD_CONVERT_URL;
    if (!worker) return new Response('MD_CONVERT_URL not set', { status: 500 });

    // Forward to worker
    const fwd = new FormData();
    fwd.append('file', file, file.name);
    fwd.append('origin', origin);
    if (tags) fwd.append('tags', tags);

    const res = await fetch(`${worker}/convert`, { method: 'POST', body: fwd });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return new Response(`Worker error ${res.status}: ${t}`, { status: 502 });
    }

    const zipBytes = await res.arrayBuffer();
    const { files } = await unzipToMemory(zipBytes);

    // Try to find manifest.json
    const manifestEntry = files.find(f => f.path.endsWith('manifest.json'));
    const manifest = manifestEntry ? JSON.parse(new TextDecoder().decode(new Uint8Array(manifestEntry.data))) : null;
    const slug = manifest?.slug || (file.name.replace(/
+/g, '').split('.')?.[0] ?? 'upload');

    // Optional: merge front-matter into markdown files (OFF by default)
    if (process.env.FRONTMATTER_MERGE === 'true' && manifest) {
      const patch = patchFromManifest(manifest);
      for (const f of files) {
        if (f.path.toLowerCase().endsWith('.md')) {
          const text = new TextDecoder().decode(new Uint8Array(f.data));
          const merged = mergeFrontmatter(text, patch);
          f.data = new TextEncoder().encode(merged).buffer;
        }
      }
    }

    const supabase = getSupabase();
    const uploaded: { path: string; bytes: number }[] = [];

    if (supabase) {
      for (const f of files) {
        const path = `files/${slug}/${f.path}`;
        await uploadBuffer(supabase, path, f.data, contentTypeFromPath(f.path));
        uploaded.push({ path, bytes: f.data.byteLength });
      }
      // Optional: upsert knowledge row (OFF by default)
      if (process.env.INGEST_DB === 'true') {
        await upsertKnowledge(supabase, {
          slug,
          title: manifest?.title || null,
          manifest_path: `files/${slug}/manifest.json`,
          tags: manifest?.tags || null,
          sha256: manifest?.source?.sha256 || null,
          meta: manifest || null,
        });
      }
    } else {
      for (const f of files) {
        uploaded.push({ path: `files/${slug}/${f.path}`, bytes: f.data.byteLength });
      }
    }

    // For now, just return a stub response to confirm deployment.
    return Response.json({ ok: true, note: 'convert route scaffold', mdConvertUrl });
  } catch (e: any) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
