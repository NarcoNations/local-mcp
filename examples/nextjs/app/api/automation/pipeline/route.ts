import { NextResponse } from 'next/server';

const pipelines = {
  updatedAt: '2025-11-01T22:44:00Z',
  flows: [
    {
      name: 'Document ingest → md-convert → Supabase',
      status: 'healthy',
      lastSuccess: '2025-11-01T22:20:34Z',
      owner: 'Ops Coordinator',
      steps: ['Watch upload bucket', 'Call md-convert worker', 'Persist manifest', 'Trigger embeddings job']
    },
    {
      name: 'Historian chat sync',
      status: 'attention',
      lastSuccess: '2025-11-01T21:58:11Z',
      owner: 'Historian',
      steps: ['Diff ChatGPT export', 'Tag personas', 'Insert into conversations/messages tables']
    },
    {
      name: 'Social Playground scheduler',
      status: 'paused',
      lastSuccess: '2025-10-29T15:06:02Z',
      owner: 'Marketing Ops',
      steps: ['Pull research engine outputs', 'Generate copy variations', 'Queue to publishing API']
    }
  ],
  alerts: [
    { level: 'info', message: 'Supabase embeddings job completed in 92s (below SLO).' },
    { level: 'warn', message: 'Historian sync backlog at 5 conversations. Consider scaling worker pods.' }
  ]
};

export async function GET() {
  return NextResponse.json({ ok: true, pipelines }, { status: 200 });
}
