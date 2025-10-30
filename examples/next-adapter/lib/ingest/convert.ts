import crypto from 'node:crypto';
import { unzip } from 'unzipit';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import type { KnowledgeRow } from '@/examples/next-adapter/lib/db';

type ManifestFile = {
  path: string;
  size: number;
  content_type: string | null;
};

type Manifest = {
  slug: string;
  title: string;
  sha256: string;
  created_at: string;
  files: ManifestFile[];
  archive_path?: string;
};

function safeBaseName(name: string) {
  const dot = name.lastIndexOf('.');
  const raw = dot > -1 ? name.slice(0, dot) : name;
  // replace non-alnum with '-' without regex to avoid escapes in this file
  let cleaned = '';
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isNum = code >= 48 && code <= 57;
    if (isUpper || isLower || isNum || ch === '-') cleaned += ch;
    else cleaned += '-';
  }
  while (cleaned.startsWith('-')) cleaned = cleaned.slice(1);
  while (cleaned.endsWith('-')) cleaned = cleaned.slice(0, -1);
  return cleaned.toLowerCase();
}

export function makeSlug(name: string) {
  return `${safeBaseName(name)}-${Date.now()}`;
}

export async function convertWithMd(file: File) {
  const mdConvertUrl = process.env.MD_CONVERT_URL!;
  const fd = new FormData();
  fd.append('file', file, file.name);
  const res = await fetch(mdConvertUrl + '/convert', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('md-convert failed: ' + res.status);
  const buf = await res.arrayBuffer();
  const { entries } = await unzip(buf);
  const files: ManifestFile[] = [];
  for (const key of Object.keys(entries)) {
    const entry: any = (entries as any)[key];
    files.push({
      path: key,
      size: entry.size || 0,
      content_type: inferContentType(key)
    });
  }
  const sha = sha256(buf);
  return {
    zipBytes: buf,
    manifest: (slug: string, title: string): Manifest => ({
      slug,
      title,
      sha256: sha,
      created_at: new Date().toISOString(),
      files
    })
  };
}

export async function writeToSupabase(slug: string, zipBytes: ArrayBuffer, manifest: Manifest) {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL not set');
  if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set');
  }
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const sb = sbServer();
  const zipKey = 'archives/' + slug + '.zip';
  const manKey = 'manifests/' + slug + '.json';
  const zipBlob = new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' });
  await sb.storage.from(bucket).upload(zipKey, zipBlob, { upsert: true, contentType: 'application/zip' });
  const manifestWithArchive: Manifest = { ...manifest, archive_path: zipKey };
  await sb
    .storage
    .from(bucket)
    .upload(manKey, new Blob([JSON.stringify(manifestWithArchive, null, 2)], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json'
    });

  const knowledgeRow: KnowledgeRow = {
    slug: manifest.slug,
    title: manifest.title,
    manifest_path: manKey,
    sha256: manifest.sha256,
    meta: { file_count: manifest.files.length, archive_path: zipKey }
  };

  const { data: knowledgeData, error: knowledgeError } = await sb
    .from('knowledge')
    .upsert(knowledgeRow, { onConflict: 'slug' })
    .select()
    .single();
  if (knowledgeError) throw knowledgeError;
  if (!knowledgeData?.id) throw new Error('Failed to retrieve knowledge id');

  const knowledgeId = knowledgeData.id;

  await sb.from('knowledge_files').delete().eq('knowledge_id', knowledgeId);
  if (manifest.files.length) {
    const insertRows = manifest.files.map((file) => ({
      knowledge_id: knowledgeId,
      path: file.path,
      content_type: file.content_type,
      bytes: file.size
    }));
    const { error: filesError } = await sb.from('knowledge_files').insert(insertRows);
    if (filesError) throw filesError;
  }

  return { bucket, zipKey, manKey, knowledgeId };
}

function sha256(buf: ArrayBuffer) {
  return crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
}

function inferContentType(path: string): string | null {
  const lower = path.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return null;
}
