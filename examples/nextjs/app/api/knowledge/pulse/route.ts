import { NextResponse } from 'next/server';

const pulse = {
  pipelines: [
    {
      name: 'Document ingest',
      status: 'healthy',
      lastRun: '2025-11-01T22:20:00Z',
      metrics: { queued: 0, processed: 12, durationSeconds: 84 }
    },
    {
      name: 'Supabase mirror',
      status: 'lagging',
      lastRun: '2025-11-01T22:15:00Z',
      metrics: { queued: 2, processed: 8, durationSeconds: 142 }
    },
    {
      name: 'Historian chat sync',
      status: 'catching-up',
      lastRun: '2025-11-01T21:58:00Z',
      metrics: { queued: 5, processed: 24, durationSeconds: 310 }
    }
  ],
  vectorCache: {
    embeddingsCached: 58032,
    embeddingsStale: 196,
    model: 'Xenova/all-MiniLM-L6-v2',
    cacheDir: '.mcp-nn/embeddings'
  },
  watcher: {
    active: true,
    watching: ['docs/', 'docs/chatgpt-export-md/', 'public/dossiers/'],
    eventsLastHour: 18
  }
};

export async function GET() {
  return NextResponse.json({ ok: true, pulse }, { status: 200 });
}
