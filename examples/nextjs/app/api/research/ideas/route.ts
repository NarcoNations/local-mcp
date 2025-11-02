import { NextResponse } from 'next/server';

const ideas = {
  generatedAt: '2025-11-01T22:42:00Z',
  persona: 'Ideas Lab',
  campaign: 'Port Vigil — Antwerp spotlight',
  angles: [
    {
      title: 'Interactive crime map feature',
      narrative: 'Layer live seizure data with NarcoNations cultural indices to show socio-economic impact.',
      assets: ['Crime-Map Playground scene', 'Showroom tile', 'Short-form social script']
    },
    {
      title: 'Ethics lens mini-doc',
      narrative: 'Pair Historian interviews with local voices to examine collateral damage of interdiction.',
      assets: ['Prompt pack for interviews', 'Storyboard outline', 'Podcast script beats']
    },
    {
      title: 'Ops Coordinator field kit',
      narrative: 'Build a sharable operations brief with rapid lookups, persona hints, and watch alerts.',
      assets: ['Notion export template', 'n8n trigger list', 'LLM prompt macro']
    }
  ],
  nextActions: ['Sync with Strategy Board for tone calibration', 'Route to Social Playground staging queue', 'Kickoff Research Engine deep dive']
};

export async function GET() {
  return NextResponse.json({ ok: true, ideas }, { status: 200 });
}
