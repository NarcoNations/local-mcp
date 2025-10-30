import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/flags';
import { DATASETS, getDataset, type EvalDataset } from './datasets';

export type EvalRunResult = {
  id: string;
  dataset: EvalDataset;
  modelResults: Array<{
    model: string;
    metrics: Record<string, number>;
    responses: { prompt: string; expected: string; actual: string; latency_ms: number }[];
  }>;
};

function safeSupabase() {
  try {
    return sbServer();
  } catch (_) {
    return null;
  }
}

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function bleuLike(expected: string, actual: string) {
  const exp = normalize(expected).split(' ');
  const act = normalize(actual).split(' ');
  if (exp.length === 0 || act.length === 0) return 0;
  const matches = act.filter((word) => exp.includes(word)).length;
  return matches / act.length;
}

function simulateModelResponse(model: string, prompt: string, expected: string) {
  if (process.env.USE_MOCKS === 'true') {
    return { text: expected, latency: 400 + Math.random() * 150 };
  }
  // EDIT HERE: plug into LLM Router
  const variation = `${expected} (checked via ${model})`;
  return { text: variation, latency: 800 + Math.random() * 400 };
}

export async function runEval({ datasetId, models }: { datasetId: string; models: string[] }) {
  const dataset = getDataset(datasetId);
  if (!dataset) throw new Error(`Unknown dataset: ${datasetId}`);

  const results: EvalRunResult['modelResults'] = [];

  for (const model of models) {
    const responses = dataset.samples.map((sample) => {
      const start = Date.now();
      const { text, latency } = simulateModelResponse(model, sample.prompt, sample.expected);
      const latencyMs = latency ?? Date.now() - start;
      return {
        prompt: sample.prompt,
        expected: sample.expected,
        actual: text,
        latency_ms: latencyMs,
      };
    });
    const exactMatches = responses.filter((r) => normalize(r.actual) === normalize(r.expected)).length;
    const bleuScores = responses.map((r) => bleuLike(r.expected, r.actual));
    const metrics = {
      exact_match: responses.length ? exactMatches / responses.length : 0,
      bleu_like: bleuScores.reduce((sum, value) => sum + value, 0) / (bleuScores.length || 1),
      avg_latency_ms:
        responses.reduce((sum, value) => sum + value.latency_ms, 0) / (responses.length || 1),
      avg_tokens: responses.reduce((sum) => sum + 128, 0) / (responses.length || 1),
    };
    results.push({ model, metrics, responses });
  }

  const sb = safeSupabase();
  let evalId: string | null = null;
  if (sb) {
    const { data: evalRow } = await sb
      .from('evals')
      .select()
      .eq('dataset_ref', datasetId)
      .limit(1)
      .maybeSingle();
    if (evalRow?.id) {
      evalId = evalRow.id;
    } else {
      const { data } = await sb
        .from('evals')
        .insert({ name: dataset.name, type: dataset.type, dataset_ref: datasetId })
        .select()
        .single();
      evalId = data?.id ?? null;
    }
    for (const result of results) {
      await sb.from('eval_runs').insert({
        eval_id: evalId,
        model: result.model,
        metrics: result.metrics,
        finished_at: new Date().toISOString(),
      });
    }
  }

  return {
    id: evalId ?? 'mock-run',
    dataset,
    modelResults: results,
  } satisfies EvalRunResult;
}

export function listDatasets() {
  return featureFlags.evals() ? DATASETS : DATASETS.slice(0, 1);
}
