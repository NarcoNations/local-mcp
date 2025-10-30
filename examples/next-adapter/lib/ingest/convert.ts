import crypto from 'node:crypto';
import path from 'node:path';
import { unzip } from 'unzipit';
import { sbServer } from '../supabase/server';

export type ManifestFile = {
  path: string;
  bytes: number;
  contentType: string | null;
  sha256?: string;
};

export type KnowledgeManifest = {
  slug: string;
  title: string;
  source: string;
  generatedAt: string;
  sha256: string;
  files: ManifestFile[];
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
  const res = await fetch(joinUrl(mdConvertUrl, '/convert'), { method: 'POST', body: fd });
  if (!res.ok) throw new Error('md-convert failed: ' + res.status);
  const buf = await res.arrayBuffer();
  const { entries } = await unzip(buf);
  const files: ManifestFile[] = [];
  const names = Object.keys(entries || {});
  for (const key of names) {
    const entry: any = (entries as any)[key];
    if (!entry) continue;
    if (entry.isDirectory || key.endsWith('/')) continue;
    const size = entry.size ?? 0;
    files.push({
      path: key,
      bytes: typeof size === 'number' ? size : Number(size) || 0,
      contentType: guessContentType(key)
    });
  }
  return { zipBytes: buf, files, sha256: sha256(buf) };
}

export function buildManifest(slug: string, title: string, files: ManifestFile[], sha: string): KnowledgeManifest {
  return {
    slug,
    title,
    source: 'upload:md-convert',
    generatedAt: new Date().toISOString(),
    sha256: sha,
    files
  };
}

export async function writeToSupabase(slug: string, manifest: KnowledgeManifest, zipBytes: ArrayBuffer) {
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const sb = sbServer();
  const zipKey = 'archives/' + slug + '.zip';
  const manKey = 'manifests/' + slug + '.json';
  const zipBlob = new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' });
  await sb.storage.from(bucket).upload(zipKey, zipBlob, { upsert: true, contentType: 'application/zip' });
  await sb.storage
    .from(bucket)
    .upload(manKey, new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json'
    });

  const { data: knowledgeRow, error: knowledgeError } = await sb
    .from('knowledge')
    .upsert(
      { slug, title: manifest.title, manifest_path: manKey, sha256: manifest.sha256 },
      { onConflict: 'slug' }
    )
    .select('id')
    .maybeSingle();
  if (knowledgeError) throw knowledgeError;
  const knowledgeId = knowledgeRow?.id;
  if (!knowledgeId) throw new Error('knowledge insert missing id');

  await sb.from('knowledge_files').delete().eq('knowledge_id', knowledgeId);
  if (manifest.files.length) {
    const rows = manifest.files.map((f) => ({
      knowledge_id: knowledgeId,
      path: f.path,
      content_type: f.contentType,
      bytes: f.bytes
    }));
    const { error: fileError } = await sb.from('knowledge_files').insert(rows);
    if (fileError) throw fileError;
  }

  return { bucket, zipKey, manifestKey: manKey, knowledgeId };
}

function sha256(buf: ArrayBuffer) {
  return crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
}

function guessContentType(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (!ext) return null;
  if (ext === '.md' || ext === '.markdown') return 'text/markdown';
  if (ext === '.txt') return 'text/plain';
  if (ext === '.json') return 'application/json';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.html' || ext === '.htm') return 'text/html';
  if (ext === '.csv') return 'text/csv';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  return null;
}

function joinUrl(base: string, pathSuffix: string) {
  if (!base.endsWith('/') && !pathSuffix.startsWith('/')) return base + '/' + pathSuffix;
  if (base.endsWith('/') && pathSuffix.startsWith('/')) return base + pathSuffix.slice(1);
  return base + pathSuffix;
}
