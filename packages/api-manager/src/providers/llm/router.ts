import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { DEFAULT_FALLBACK, MODELS, TASK_POLICIES } from '../../../config/llm-routing/policy';
import type { LLMResult, LLMRun } from '../../types';
import { insertSupabase } from '../../utils';

type RunOptions = {
  supabase?: { url: string; serviceKey: string } | null;
};

class ProviderError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function runLLM(run: LLMRun, options: RunOptions = {}): Promise<LLMResult> {
  const policy = TASK_POLICIES[run.task] ?? {
    prefer: ['openai:gpt-4o-mini'],
    fallback: [DEFAULT_FALLBACK],
    maxCostPerCall: 0.5,
    maxLatencyMs: 15_000
  };
  const supabase = options.supabase ?? inferSupabase();

  const candidates = buildCandidateList(run, policy);
  const promptHash = crypto.createHash('sha256').update(run.prompt).digest('hex');
  const attempted: string[] = [];
  let result: LLMResult | undefined;
  let lastError: string | undefined;

  for (const candidate of candidates) {
    attempted.push(candidate);
    const modelInfo = MODELS[candidate];
    if (modelInfo) {
      const estCost = (estimatePromptTokens(run.prompt) / 1000) * modelInfo.costPer1kTokens;
      if (estCost > (policy.maxCostPerCall ?? Number.POSITIVE_INFINITY)) {
        lastError = `Cost guard skipped ${candidate}`;
        continue;
      }
      if (modelInfo.latencyTargetMs > (policy.maxLatencyMs ?? 30_000)) {
        lastError = `Latency guard skipped ${candidate}`;
        continue;
      }
    }
    try {
      const candidateResult = await executeModel(candidate, run, policy.maxLatencyMs);
      result = decorateResult(candidateResult, run.task, candidate, attempted, policy);
      break;
    } catch (err: any) {
      lastError = err?.message || 'llm provider error';
      if (attempted.length === candidates.length) {
        result = decorateResult(
          {
            ok: false,
            output: '',
            latencyMs: 0,
            tokens: estimatePromptTokens(run.prompt),
            costEstimate: 0,
            error: lastError
          },
          run.task,
          candidate,
          attempted,
          policy
        );
      }
    }
  }

  if (!result) {
    result = decorateResult(
      {
        ok: false,
        output: '',
        latencyMs: 0,
        tokens: estimatePromptTokens(run.prompt),
        costEstimate: 0,
        error: lastError ?? 'No model available'
      },
      run.task,
      DEFAULT_FALLBACK,
      attempted,
      policy
    );
  }

  await persistPromptRun(supabase, {
    task: run.task,
    model: result.model,
    promptHash,
    prompt: run.prompt,
    costEstimate: result.costEstimate,
    latencyMs: result.latencyMs,
    ok: result.ok,
    outputPreview: result.output?.slice(0, 240) ?? '',
    metadata: run.metadata ?? {}
  });

  return { ...result, promptHash };
}

function buildCandidateList(run: LLMRun, policy: { prefer: string[]; fallback: string[] }) {
  const base = [...policy.prefer, ...policy.fallback, DEFAULT_FALLBACK];
  const hinted = run.modelHint ? [normalizeHint(run.modelHint)] : [];
  const unique = new Set([...hinted, ...base].filter(Boolean));
  return Array.from(unique);
}

function normalizeHint(hint: string) {
  const trimmed = hint.trim().toLowerCase();
  if (trimmed.includes('local')) return 'local:minilm';
  if (trimmed.includes('haiku')) return 'anthropic:claude-3-haiku';
  if (trimmed.includes('4o')) return 'openai:gpt-4o-mini';
  return trimmed.includes(':') ? trimmed : `openai:${trimmed}`;
}

async function executeModel(modelKey: string, run: LLMRun, latencyBudgetMs: number) {
  if (modelKey.startsWith('local:')) {
    return runLocal(modelKey, run);
  }
  if (modelKey.startsWith('openai:')) {
    return runOpenAI(modelKey, run, latencyBudgetMs);
  }
  if (modelKey.startsWith('anthropic:')) {
    throw new ProviderError('Anthropic provider not configured for free tier', 503);
  }
  throw new ProviderError('Unknown model provider');
}

async function runOpenAI(modelKey: string, run: LLMRun, latencyBudgetMs: number) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ProviderError('OPENAI_API_KEY missing', 401);
  const model = modelKey.split(':')[1] || 'gpt-4o-mini';
  const promptTokens = estimatePromptTokens(run.prompt);
  const start = performance.now();
  let attempt = 0;
  let lastErr: any;
  while (attempt < 3) {
    attempt += 1;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: `Task: ${run.task}` }, { role: 'user', content: run.prompt }],
        temperature: 0.7,
        stream: false
      })
    });
    if (res.status === 429) {
      await delay(Math.min(latencyBudgetMs, 500 * attempt ** 2));
      lastErr = new ProviderError('Rate limited by OpenAI', res.status);
      continue;
    }
    if (!res.ok) {
      const details = await safeJson(res);
      throw new ProviderError(details?.error?.message || 'OpenAI request failed', res.status, details);
    }
    const json = await res.json();
    const output = json.choices?.[0]?.message?.content || '';
    const latencyMs = Math.round(performance.now() - start);
    const totalTokens = json.usage?.total_tokens ?? promptTokens * 2;
    const costRate = MODELS[modelKey]?.costPer1kTokens ?? 0.3;
    const costEstimate = (totalTokens / 1000) * costRate;
    return {
      ok: true,
      output,
      latencyMs,
      tokens: totalTokens,
      costEstimate
    };
  }
  throw lastErr ?? new ProviderError('OpenAI retries exceeded', 429);
}

function runLocal(modelKey: string, run: LLMRun) {
  const latencyMs = Math.round(500 + Math.random() * 500);
  const suffix = run.prompt.length > 280 ? '…' : '';
  const output = `【LOCAL:${modelKey.split(':')[1] || 'minilm'}】 ${run.task.toUpperCase()} → ${run.prompt.slice(0, 280)}${suffix}`;
  return {
    ok: true,
    output,
    latencyMs,
    tokens: estimatePromptTokens(run.prompt),
    costEstimate: 0
  };
}

function decorateResult(
  base: { ok: boolean; output: string; latencyMs: number; tokens: number; costEstimate: number; error?: string },
  task: LLMRun['task'],
  model: string,
  attempted: string[],
  policy: { fallback: string[] }
): LLMResult {
  return {
    task,
    model,
    output: base.output,
    ok: base.ok,
    latencyMs: base.latencyMs,
    costEstimate: Number(base.costEstimate.toFixed(4)),
    promptHash: '',
    policy: {
      chosen: model,
      attempted,
      fallbackUsed: attempted.length > 0 && attempted[0] !== model && policy.fallback.includes(model)
    },
    error: base.error
  };
}

async function persistPromptRun(
  supabase: { url: string; serviceKey: string } | null,
  payload: {
    task: string;
    model: string;
    promptHash: string;
    prompt: string;
    costEstimate: number;
    latencyMs: number;
    ok: boolean;
    outputPreview: string;
    metadata: Record<string, unknown>;
  }
) {
  await insertSupabase(supabase, 'prompt_runs', {
    task: payload.task,
    model: payload.model,
    prompt_hash: payload.promptHash,
    prompt_body: payload.prompt,
    cost_est: payload.costEstimate,
    latency_ms: payload.latencyMs,
    ok: payload.ok,
    output_preview: payload.outputPreview,
    metadata: payload.metadata,
    created_at: new Date().toISOString()
  });
}

function estimatePromptTokens(prompt: string) {
  return Math.max(1, Math.ceil(prompt.length / 4));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
}

function inferSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return { url, serviceKey: key };
  return null;
}
