export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { recordEvalRun } from '@/examples/next-adapter/lib/evals';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const DATASET_FIXTURE = [
  { id: 'sample-1', input: 'Draft crisis comms update for border incident.', expected: 'Keep calm, cite humanitarian aid.' },
  { id: 'sample-2', input: 'Provide social caption for embargoed intel drop.', expected: 'Tease insights, no operational details.' },
];

function simulateMetrics(model: string) {
  const base = model.length % 10;
  return {
    bleu_like: Math.max(0.6, 0.8 - base * 0.01),
    avg_latency_ms: 900 + base * 40,
    avg_tokens_out: 380 + base * 11,
    judge_score: Math.max(0, 5 - base * 0.1),
  };
}

export async function POST(req: NextRequest) {
  if (!flagEnabled('evals')) {
    return new Response('Eval lab disabled', { status: 503 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.eval_id !== 'string' || !Array.isArray(body.models)) {
    return new Response('Invalid payload', { status: 400 });
  }
  const auth = await validateApiKey(req.headers, 'llm:*', 'evals.run', body.eval_id);
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const models: string[] = body.models;

  const runs = await Promise.all(
    models.map(async (model: string) => {
      const started = new Date().toISOString();
      // EDIT HERE: Replace with actual router integration when ready.
      const metrics = simulateMetrics(model);
      const finished = new Date().toISOString();
      const run = {
        id: crypto.randomUUID(),
        eval_id: body.eval_id,
        model,
        prompt_id: body.prompt_id ?? null,
        started_at: started,
        finished_at: finished,
        metrics: {
          ...metrics,
          dataset: DATASET_FIXTURE.length,
        },
      };
      await recordEvalRun(run);
      return run;
    })
  );

  await logEvent({
    source: 'evals',
    kind: 'evals.run',
    title: `Eval ${body.eval_id} executed`,
    meta: { evalId: body.eval_id, models }
  });

  return Response.json({ ok: true, runs, dataset_size: DATASET_FIXTURE.length });
}
