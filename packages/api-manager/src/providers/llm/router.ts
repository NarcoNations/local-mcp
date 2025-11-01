import { performance } from 'perf_hooks';
import type { LLMRun } from '../../types';
import { chooseModel, getPolicy } from './policy';

type RunResult = {
  model: string;
  output: string;
  ok: boolean;
  latencyMs: number;
  costEstimate: number;
  tokensEstimated: number;
  error?: string;
};

const COST_PER_1K: Record<string, number> = {
  'openai:gpt-4o-mini': 0.15,
  'openai:gpt-4o-mini-2024-08-06': 0.15,
};

export async function runLLM(run: LLMRun): Promise<RunResult> {
  const policy = getPolicy();
  const start = performance.now();
  const selectedModel = chooseModel(run.task, run.modelHint);
  const provider = selectedModel.split(':')[0];
  try {
    if (provider === 'local') {
      const result = await runLocal(selectedModel, run);
      return withMetrics(result, start, run.prompt, selectedModel);
    }

    if (provider === 'openai') {
      try {
        const result = await runOpenAI(selectedModel, run);
        return withMetrics(result, start, run.prompt, selectedModel);
      } catch (error) {
        if (policy.tasks[run.task]?.fallback?.length) {
          const fallbackModel = policy.tasks[run.task].fallback![0];
          const fallbackResult = await runLocal(fallbackModel, run);
          return withMetrics(fallbackResult, start, run.prompt, fallbackModel, error);
        }
        throw error;
      }
    }

    throw new Error(`Unsupported model provider: ${provider}`);
  } catch (error) {
    const fallbackModel = policy.tasks[run.task]?.fallback?.[0] ?? 'local:mock';
    const fallbackResult = await runLocal(fallbackModel, run);
    return withMetrics(fallbackResult, start, run.prompt, fallbackModel, error);
  }
}

async function runLocal(model: string, run: LLMRun) {
  const prefix = model.replace('local:', '');
  const output = `[LOCAL:${prefix}] ${run.task} → ${run.prompt.slice(0, 160)}...`;
  return { model, output, ok: true };
}

async function runOpenAI(model: string, run: LLMRun) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const body = {
    model: model.replace('openai:', ''),
    messages: [{ role: 'user', content: run.prompt }],
    temperature: 0.2,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    throw new Error('OpenAI rate limit reached');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const json = await res.json();
  const output = json.choices?.[0]?.message?.content ?? '';
  return { model, output, ok: true };
}

function withMetrics(
  result: { model: string; output: string; ok: boolean },
  started: number,
  prompt: string,
  model: string,
  upstreamError?: unknown
): RunResult {
  const latencyMs = performance.now() - started;
  const tokensEstimated = Math.max(1, Math.round(prompt.length / 4));
  const rate = COST_PER_1K[model] ?? 0.02;
  const costEstimate = (tokensEstimated / 1000) * rate;
  return {
    model,
    output: result.output,
    ok: result.ok,
    latencyMs,
    costEstimate,
    tokensEstimated,
    error: upstreamError instanceof Error ? upstreamError.message : undefined,
  };
}
