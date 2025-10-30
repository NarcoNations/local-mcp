import crypto from 'node:crypto';
import { unzip } from 'unzipit';
import { sbServer } from '@/lib/supabase/server';

const seenHashes = new Set<string>();

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
  const files: { path: string; size: number }[] = [];
  for (const key of Object.keys(entries)) {
    const entry: any = (entries as any)[key];
    files.push({ path: key, size: entry.size || 0 });
  }
  return { zipBytes: buf, files, sha256: sha256(buf) };
}

export function wasProcessed(hash: string) {
  return seenHashes.has(hash);
}

export function rememberHash(hash: string) {
  seenHashes.add(hash);
}

export async function writeToSupabase(slug: string, zipBytes: ArrayBuffer, files: { path: string; size: number }[]) {
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const sb = sbServer();
  const zipKey = 'archives/' + slug + '.zip';
  const manKey = 'manifests/' + slug + '.json';
  const zipBlob = new Blob([new Uint8Array(zipBytes)], { type: 'application/zip' });
  await sb.storage.from(bucket).upload(zipKey, zipBlob, { upsert: true, contentType: 'application/zip' });
  await sb.storage.from(bucket).upload(manKey, new Blob([JSON.stringify({ files }, null, 2)], { type: 'application/json' }), { upsert: true, contentType: 'application/json' });
  return { bucket, zipKey, manKey };
}

function sha256(buf: ArrayBuffer) {
  return crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
}
