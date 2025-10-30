export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { processChatExportFromUrl } from '@/examples/next-adapter/lib/corpus/chatgpt';

export async function POST(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) return new Response('fileUrl required', { status: 400 });
    const result = await processChatExportFromUrl(fileUrl);

    await logEvent({
      source: 'ingest',
      kind: 'ingest.chatgpt',
      title: 'ChatGPT export ingested',
      meta: { ...result, fileUrl }
    });

    return Response.json({ ok: true, ...result });
  } catch (e: any) {
    await logEvent({ source: 'ingest', kind: 'error', title: 'chatgpt ingest failed', body: e?.message });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
