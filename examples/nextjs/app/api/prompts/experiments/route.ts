import { NextResponse } from 'next/server';

const experiments = {
  queue: [
    {
      id: 'exp-ops-latency',
      status: 'queued',
      hypothesis: 'Local llama.cpp model can replace gpt-4o-mini for Ops alerts with <15% latency penalty.',
      variants: ['local-llama-13b-q5', 'gpt-4o-mini'],
      metrics: ['tone-adherence', 'latency', 'cost']
    },
    {
      id: 'exp-strategy-tone',
      status: 'running',
      hypothesis: 'Prompt revision v3 improves story arc coherence for Strategy Board briefs.',
      variants: ['prompt-v2', 'prompt-v3'],
      metrics: ['coherence', 'citation-density', 'feedback-score']
    }
  ],
  nextRun: '2025-11-02T09:00:00Z'
};

export async function GET() {
  return NextResponse.json({ ok: true, experiments }, { status: 200 });
}
