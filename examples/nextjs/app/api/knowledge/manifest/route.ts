import { NextResponse } from 'next/server';

const manifest = {
  updatedAt: '2025-11-01T22:40:00Z',
  totals: {
    documents: 1248,
    embeddings: 58032,
    chatTranscripts: 1029,
    pdfs: 312,
    markdown: 716,
    dossiers: 96,
    assets: 184
  },
  recent: [
    { title: 'Port Security Audit — Antwerp', type: 'pdf', indexedAt: '2025-10-31T18:22:00Z' },
    { title: 'ChatGPT • Harbor analytics thread', type: 'chat', indexedAt: '2025-10-31T16:08:00Z' },
    { title: 'Narco supply chain briefs', type: 'markdown', indexedAt: '2025-10-30T23:52:00Z' }
  ],
  supersets: ['docs/', 'public/dossiers/', 'docs/chatgpt-export-md/'],
  pgvector: {
    table: 'knowledge_embeddings',
    dimension: 384,
    index: 'ivfflat_cosine_100',
    syncLagMinutes: 7
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const summary = url.searchParams.get('summary');
  if (summary) {
    return NextResponse.json(
      {
        ok: true,
        summary: {
          documents: manifest.totals.documents,
          embeddings: manifest.totals.embeddings,
          syncLagMinutes: manifest.pgvector.syncLagMinutes,
          lastIndexed: manifest.recent[0]?.indexedAt
        }
      },
      { status: 200 }
    );
  }
  return NextResponse.json({ ok: true, manifest }, { status: 200 });
}
