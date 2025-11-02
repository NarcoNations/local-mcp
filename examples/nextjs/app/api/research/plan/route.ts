import { NextResponse } from 'next/server';

const samplePlan = {
  query: 'Port security and narcotics smuggling corridors',
  generatedAt: '2025-11-01T22:41:00Z',
  phases: [
    {
      title: 'Scan NarcoNations corpus',
      actions: [
        'Hybrid search for Antwerp, Rotterdam, and Valencia port dossiers.',
        'Pull Historian chat threads tagged "port security" for Ops insights.',
        'Collect Statista-style figures on throughput and interdiction rates.'
      ],
      outputs: ['Link pack with 12 citations', 'Embeddings context window']
    },
    {
      title: 'Synthesize risk map',
      actions: [
        'Generate SWOT matrix for each corridor with confidence ratings.',
        'Highlight emerging tradecraft from last 30 days of Historian chat logs.'
      ],
      outputs: ['Two-page narrative brief', 'Annotated map layers']
    },
    {
      title: 'Recommend interventions',
      actions: [
        'Draft Ops Coordinator task list for watchers + alerts.',
        'Propose public narrative angles for Strategy Board sign-off.'
      ],
      outputs: ['Ops checklist', 'Comms storyline bullets']
    }
  ],
  citations: [
    { source: 'docs/dossiers/port-antwerp-2025.pdf', snippet: 'Risk corridor influx + contact trees.' },
    { source: 'docs/chatgpt-export-md/ops-coordinator-antwerp.md', snippet: 'Live intercept tactics from Oct 31 workshop.' }
  ]
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body?.query === 'string' ? body.query : samplePlan.query;
  return NextResponse.json({ ok: true, plan: { ...samplePlan, query: prompt } }, { status: 200 });
}
