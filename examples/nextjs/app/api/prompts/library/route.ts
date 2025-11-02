import { NextResponse } from 'next/server';

const library = {
  updatedAt: '2025-11-01T22:20:00Z',
  prompts: [
    {
      name: 'Strategist · Narrative weave',
      goal: 'Blend factual pulls with emotional resonance for campaign decks.',
      models: ['gpt-4.1', 'claude-3.5'],
      lastScore: 4.6,
      tags: ['strategy', 'tone', 'deck']
    },
    {
      name: 'Ops Coordinator · Watch alert triage',
      goal: 'Summarise watcher events and propose next actions in under 120 words.',
      models: ['local-llama-70b', 'gpt-4o-mini'],
      lastScore: 4.3,
      tags: ['ops', 'alerts']
    },
    {
      name: 'Historian · Timeline digest',
      goal: 'Transform chat transcripts and watcher logs into a daily recap with citations.',
      models: ['gpt-4o', 'mistral-large'],
      lastScore: 4.8,
      tags: ['historian', 'recap']
    }
  ],
  evaluations: {
    lastRun: '2025-10-30T19:05:00Z',
    passing: 18,
    failing: 3,
    routerPolicy: 'cost-aware-v2'
  }
};

export async function GET() {
  return NextResponse.json({ ok: true, library }, { status: 200 });
}
