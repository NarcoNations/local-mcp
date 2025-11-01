import { NextRequest, NextResponse } from 'next/server';
import { runLLM } from '@vibelabz/api-manager';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { getDataset } from '@/examples/next-adapter/lib/evals/datasets';
import { isFlagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { recordAudit } from '@/examples/next-adapter/lib/audit';
import { recordProviderUsage } from '@/examples/next-adapter/lib/telemetry';

function score(output: string, expected: string) {
  const normalizedOut = output.trim().toLowerCase();
  const normalizedExpected = expected.trim().toLowerCase();
  const exact = normalizedOut === normalizedExpected ? 1 : 0;
  const lengthDelta = Math.abs(output.length - expected.length);
  const tokens = normalizedExpected.split(/\s+/);
  const matches = tokens.filter((token) => normalizedOut.includes(token)).length;
  const coverage = tokens.length ? matches / tokens.length : 0;
  return { exact, coverage, lengthDelta };
}

export async function POST(request: NextRequest) {
  if (!isFlagEnabled('FF_EVALS')) {
    return NextResponse.json({ error: 'Eval feature disabled' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.datasetId || !Array.isArray(body.models) || body.models.length === 0) {
    return NextResponse.json({ error: 'datasetId and models required' }, { status: 400 });
  }
  const dataset = getDataset(body.datasetId);
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }
  const supabase = sbServer();

  let evalId: string | null = body.evalId ?? null;
  if (!evalId) {
    const { data: existing } = await supabase
      .from('evals')
      .select('id')
      .eq('dataset_ref', dataset.id)
      .maybeSingle();
    if (existing) {
      evalId = existing.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from('evals')
        .insert({ name: dataset.name, type: 'offline', dataset_ref: dataset.id })
        .select()
        .maybeSingle();
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      evalId = created?.id ?? null;
    }
  }

  if (!evalId) {
    return NextResponse.json({ error: 'Eval id missing' }, { status: 500 });
  }

  const leaderboard: any[] = [];

  for (const model of body.models) {
    let totalExact = 0;
    let totalCoverage = 0;
    let totalLatency = 0;
    let totalLengthDelta = 0;
    const details: any[] = [];

    const provider = model.includes('local') ? 'local' : 'openai';
    for (const sample of dataset.samples) {
      const started = Date.now();
      const result = await runLLM({
        task: 'eval',
        prompt: sample.prompt,
        modelHint: model,
      } as any);
      const latency = Date.now() - started;
      totalLatency += latency;
      const output = result?.output ?? '[missing output]';
      const { exact, coverage, lengthDelta } = score(output, sample.expected);
      totalExact += exact;
      totalCoverage += coverage;
      totalLengthDelta += lengthDelta;
      details.push({ sampleId: sample.id, output, latency, exact, coverage, lengthDelta });
      await recordProviderUsage({
        provider,
        model,
        operation: 'eval',
        tokensIn: sample.prompt.length / 4,
        tokensOut: output.length / 4,
        latencyMs: latency,
        meta: { sampleId: sample.id },
      });
    }

    const metrics = {
      accuracy: totalExact / dataset.samples.length,
      coverage: totalCoverage / dataset.samples.length,
      avgLatencyMs: Math.round(totalLatency / dataset.samples.length),
      avgLengthDelta: totalLengthDelta / dataset.samples.length,
    };

    const { data: runRow, error: runError } = await supabase
      .from('eval_runs')
      .insert({
        eval_id: evalId,
        model,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        metrics,
      })
      .select()
      .maybeSingle();
    if (runError) {
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    leaderboard.push({ model, metrics, runId: runRow?.id, details });
    await logEvent({
      source: 'evals',
      kind: 'eval.completed',
      title: `Eval ${dataset.name} → ${model}`,
      meta: { metrics },
    });
  }

  await recordAudit({
    actor: request.headers.get('x-api-key-id') ?? 'web',
    action: 'evals.run',
    resource: dataset.id,
    meta: { models: body.models },
  });

  return NextResponse.json({ evalId, leaderboard });
}
