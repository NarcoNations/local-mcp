import crypto from 'node:crypto';
import { unzip } from 'unzipit';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export type ManifestFile = {
  path: string;
  bytes: number;
  contentType: string | null;
};

export type IngestManifest = {
  slug: string;
  title: string;
  originalName: string;
  createdAt: string;
  source: string;
  sha256: string;
  files: ManifestFile[];
  meta: Record<string, unknown>;
};

function safeBaseName(name: string) {
  const dot = name.lastIndexOf('.');
  const raw = dot > -1 ? name.slice(0, dot) : name;
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

export async function convertWithMd(file: File, slug: string) {
  const mdConvertUrl = process.env.MD_CONVERT_URL;
  if (!mdConvertUrl) throw new Error('MD_CONVERT_URL not set');

  const fd = new FormData();
  fd.append('file', file, file.name);
  const res = await fetch(mdConvertUrl.replace(/\/$/, '') + '/convert', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('md-convert failed: ' + res.status);

  const zipBytes = await res.arrayBuffer();
  const { entries } = await unzip(zipBytes);
  const files: ManifestFile[] = [];
  for (const key of Object.keys(entries)) {
    const entry: any = (entries as any)[key];
    if (!entry || entry.isDirectory) continue;
    const bytes = typeof entry.size === 'number' ? entry.size : 0;
    files.push({ path: key, bytes, contentType: guessContentType(key) });
  }

  const sha = sha256(zipBytes);
  const manifest: IngestManifest = {
    slug,
    title: file.name,
    originalName: file.name,
    createdAt: new Date().toISOString(),
    source: 'md-convert',
    sha256: sha,
    files,
    meta: { fileCount: files.length }
  };

  return { zipBytes, manifest };
}

export async function writeToSupabase(params: { slug: string; manifest: IngestManifest; zipBytes: ArrayBuffer }) {
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const sb = sbServer();
  const archivePath = `archives/${params.slug}.zip`;
  const manifestPath = `manifests/${params.slug}.json`;

  const zipBlob = new Blob([Buffer.from(params.zipBytes)], { type: 'application/zip' });
  const manifestWithStorage = {
    ...params.manifest,
    storage: { bucket, archivePath, manifestPath }
  };

  await sb.storage.from(bucket).upload(archivePath, zipBlob, {
    upsert: true,
    contentType: 'application/zip',
    cacheControl: '3600'
  });
  await sb.storage.from(bucket).upload(
    manifestPath,
    new Blob([JSON.stringify(manifestWithStorage, null, 2)], { type: 'application/json' }),
    { upsert: true, contentType: 'application/json', cacheControl: '3600' }
  );

  const { data: knowledgeRow, error: knowledgeErr } = await sb
    .from('knowledge')
    .upsert(
      {
        slug: params.slug,
        title: params.manifest.title,
        manifest_path: manifestPath,
        sha256: params.manifest.sha256,
        meta: { ...params.manifest.meta, archivePath }
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();
  if (knowledgeErr) throw new Error('knowledge upsert failed: ' + knowledgeErr.message);

  await sb.from('knowledge_files').delete().eq('knowledge_id', knowledgeRow.id);
  if (params.manifest.files.length) {
    const rows = params.manifest.files.map((f) => ({
      knowledge_id: knowledgeRow.id,
      path: f.path,
      content_type: f.contentType,
      bytes: f.bytes
    }));
    await sb.from('knowledge_files').insert(rows);
  }

  return { bucket, archivePath, manifestPath, knowledgeId: knowledgeRow.id };
}

function guessContentType(path: string): string | null {
  const lower = path.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.json')) return 'application/json';
  return null;
}

function sha256(buf: ArrayBuffer) {
  return crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
}
