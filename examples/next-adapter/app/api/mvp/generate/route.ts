export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import JSZip from 'jszip';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const briefText = (formData.get('briefText') as string) || '';
    const briefFile = formData.get('briefFile');
    let uploadedJson: any = null;
    if (briefFile instanceof File) {
      try {
        uploadedJson = JSON.parse(await briefFile.text());
      } catch {
        uploadedJson = { raw: await briefFile.text() };
      }
    }

    const summary = briefText.trim() || (uploadedJson ? JSON.stringify(uploadedJson, null, 2) : 'No brief supplied.');
    const zip = new JSZip();
    zip.file(
      'ARCHITECTURE.md',
      `# Architecture\n\n- Inputs: ${summary.slice(0, 240)}${summary.length > 240 ? '…' : ''}\n- Stack: Next.js 14 + Supabase + pgvector\n- Services: Historian, API Manager, Knowledge Engine.`
    );
    zip.file(
      'ROUTES.md',
      `# Routes\n\n- /ingest — upload + md-convert\n- /knowledge — index + embeddings\n- /search — cosine retrieval\n- /workroom — lanes for SB/IL/PM/FE/BE/DevOps/Research/Copy/Ethics\n- /mvp — one-shot generator.`
    );
    zip.file(
      'DATA_MODEL.md',
      `# Data Model\n\n## Supabase Tables\n- knowledge (slug, title, manifest_path, sha256)\n- knowledge_files (path, bytes, content_type)\n- embeddings (knowledge_id, chunk_ix, content, embedding vector[384])\n- events (ts, source, kind, title, meta)\n\nGenerated from brief length ${summary.length}.`
    );

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const blob = new Blob([buffer], { type: 'application/zip' });

    await logEvent({
      source: 'mvp',
      kind: 'mvp.generate',
      title: 'One-shot MVP stub generated',
      meta: { hasUpload: !!uploadedJson, briefLength: summary.length }
    });

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="vibeos-mvp.zip"'
      }
    });
  } catch (err: any) {
    await logEvent({
      source: 'mvp',
      kind: 'error',
      title: 'MVP generate failed',
      meta: { error: err?.message || 'unknown' }
    });
    return new Response(err?.message || 'Failed to generate', { status: 500 });
  }
}
