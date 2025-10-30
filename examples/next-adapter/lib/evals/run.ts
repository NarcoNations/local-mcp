import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { DATASETS, EvalSample } from '@/examples/next-adapter/lib/evals/datasets';
import { featureFlags } from '@/examples/next-adapter/lib/env';
import { logEvent } from '@/examples/next-adapter/lib/historian';

function judgeLite(expected: string, actual: string) {
  const exact = expected.trim().toLowerCase() === actual.trim().toLowerCase();
  const lengthDiff = Math.abs(expected.length - actual.length);
  return {
    exact,
    lengthDiff,
    bleuish: exact ? 1 : Math.max(0, 1 - lengthDiff / Math.max(expected.length, 1)),
  };
}

async function callModel(model: string, sample: EvalSample) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (!featureFlags.evals) {
    return { output: sample.expected, tokens: sample.expected.split(/\s+/).length, latency: 50 };
  }
  const output = `${sample.expected} (model:${model})`;
  return { output, tokens: output.split(/\s+/).length, latency: 50 };
}

export async function runEval(datasetKey: string, models: string[], promptId?: string) {
  const dataset = DATASETS[datasetKey];
  if (!dataset) throw new Error('Unknown dataset');
  const supabase = sbAdmin();
  const evalId = `eval-${Date.now()}`;
  const started_at = new Date().toISOString();
  const results: any[] = [];
  for (const model of models) {
    const metrics = { exact: 0, bleuish: 0, avgLatency: 0 };
    for (const sample of dataset) {
      const start = Date.now();
      const response = await callModel(model, sample);
      const latency = Date.now() - start;
      const judge = judgeLite(sample.expected, response.output);
      metrics.exact += judge.exact ? 1 : 0;
      metrics.bleuish += judge.bleuish;
      metrics.avgLatency += latency;
    }
    metrics.exact = metrics.exact / dataset.length;
    metrics.bleuish = metrics.bleuish / dataset.length;
    metrics.avgLatency = metrics.avgLatency / dataset.length;
    const runId = `${evalId}-${model}`;
    await supabase.from('eval_runs').insert({
      id: runId,
      eval_id: evalId,
      model,
      prompt_id: promptId ?? null,
      started_at,
      finished_at: new Date().toISOString(),
      metrics,
    });
    results.push({ model, metrics, runId });
  }
  await supabase.from('evals').insert({
    id: evalId,
    name: datasetKey,
    type: 'baseline',
    dataset_ref: datasetKey,
    created_at: started_at,
  });
  await logEvent({ source: 'evals', kind: 'eval.run', title: `Eval ${datasetKey} executed`, meta: { evalId, models } });
  return { evalId, results };
}
