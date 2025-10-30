export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { convertWithMd, writeToSupabase, makeSlug } from '@/examples/next-adapter/lib/ingest/convert';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Expected multipart/form-data with file', { status: 400 });
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return new Response('Missing file', { status: 400 });
    }

    const slug = makeSlug(file.name);
    const { zipBytes, manifest } = await convertWithMd(file, slug);

    let storage: {
      bucket: string;
      archivePath: string;
      manifestPath: string;
      knowledgeId: string;
    } | null = null;
    if ((process.env.INGEST_SUPABASE || '').toLowerCase() === 'true') {
      storage = await writeToSupabase({ slug, manifest, zipBytes });
    }

    await logEvent({
      source: 'ingest',
      kind: 'ingest.convert',
      title: `Converted ${file.name}`,
      meta: { slug, count: manifest.files.length }
    });

    return Response.json({ ok: true, slug, files: manifest.files, storage });
  } catch (e: any) {
    await logEvent({ source: 'ingest', kind: 'error', title: 'convert failed', body: e?.message });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
