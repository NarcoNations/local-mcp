import { createClient } from '@supabase/supabase-js';
import { mockEvalRuns, mockEvalSets } from '@/examples/next-adapter/lib/mocks/m3';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type EvalDefinition = {
  id: string;
  name: string;
  type: string;
  dataset_ref: string;
  created_at?: string;
};

export type EvalRun = {
  id: string;
  eval_id: string;
  model: string;
  prompt_id?: string | null;
  started_at: string;
  finished_at: string;
  metrics: Record<string, any>;
};

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listEvals(): Promise<EvalDefinition[]> {
  if (!flagEnabled('evals')) return [];
  const sb = supabaseService();
  if (!sb || process.env.USE_MOCKS === 'true') return mockEvalSets;
  const { data, error } = await sb.from('evals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as EvalDefinition[];
}

export async function listEvalRuns(evalId: string): Promise<EvalRun[]> {
  if (!flagEnabled('evals')) return [];
  const sb = supabaseService();
  if (!sb || process.env.USE_MOCKS === 'true') return mockEvalRuns.filter((r) => r.eval_id === evalId);
  const { data, error } = await sb.from('eval_runs').select('*').eq('eval_id', evalId).order('started_at', { ascending: false });
  if (error) throw error;
  return data as EvalRun[];
}

export async function recordEvalRun(run: EvalRun) {
  if (!flagEnabled('evals')) return;
  const sb = supabaseService();
  if (!sb) return;
  const { error } = await sb.from('eval_runs').insert(run);
  if (error) {
    await logEvent({ source: 'evals', kind: 'evals.error', title: 'Failed to record eval run', body: error.message });
  }
}

export function rankRuns(runs: EvalRun[]) {
  return runs
    .map((run) => ({
      ...run,
      score: typeof run.metrics?.judge_score === 'number' ? run.metrics.judge_score : 0,
    }))
    .sort((a, b) => b.score - a.score);
}
