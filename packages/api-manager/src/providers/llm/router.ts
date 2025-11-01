import { ProviderError, type LLMPolicyModel, type LLMRun, type LLMRunResult } from '../../types.js';
import { loadPolicy } from './policy.js';
import { createPromptRunRecord, estimateCost, persistPromptRun } from './store.js';

interface RunOptions {
  fetcher?: typeof fetch;
  now?: () => number;
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function pickCandidates(task: LLMRun['task'], hint: string | undefined, policy: Awaited<ReturnType<typeof loadPolicy>>) {
  const config = policy.tasks[task] ?? policy.tasks.default;
  const candidates: LLMPolicyModel[] = [];
  const lowerHint = hint?.toLowerCase() ?? '';
  if (lowerHint.includes('local')) {
    if (config.local) candidates.push(config.local);
    else candidates.push({ provider: 'local', model: 'local-mock' });
    return candidates;
  }
  candidates.push(config.primary);
  if (config.secondary) candidates.push(config.secondary);
  if (config.local) candidates.push(config.local);
  else candidates.push({ provider: 'local', model: 'local-mock' });
  return candidates;
}

async function runOpenAI(candidate: LLMPolicyModel, run: LLMRun, options: RunOptions = {}): Promise<LLMRunResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new ProviderError('OPENAI_API_KEY not set', { status: 401 });
  }
  const fetcher = options.fetcher ?? fetch;
  const started = options.now ? options.now() : Date.now();
  const res = await fetcher(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: candidate.model,
      messages: [{ role: 'user', content: `${run.task}: ${run.prompt}` }],
      temperature: 0.7,
    }),
  });
  const latency = (options.now ? options.now() : Date.now()) - started;
  if (!res.ok) {
    throw new ProviderError('openai request failed', { status: res.status });
  }
  const json = await res.json();
  const output = json.choices?.[0]?.message?.content ?? '';
  const costEst = estimateCost(candidate, run.prompt, output);
  return { model: candidate.model, provider: 'openai', output, latencyMs: latency, costEst };
}

function runLocal(candidate: LLMPolicyModel, run: LLMRun, reason?: string): LLMRunResult {
  const latency = 5;
  const output = `${reason ? `[LOCAL FALLBACK: ${reason}]` : '[LOCAL]'}` +
    ` ${run.task}: ${run.prompt.slice(0, 180)}${run.prompt.length > 180 ? '…' : ''}`;
  return { model: candidate.model, provider: 'local', output, latencyMs: latency, costEst: 0, cached: true };
}

export async function runLLM(run: LLMRun, options?: RunOptions): Promise<LLMRunResult> {
  const policy = await loadPolicy();
  const candidates = pickCandidates(run.task, run.modelHint, policy);
  let lastError: string | undefined;
  for (const candidate of candidates) {
    try {
      let result: LLMRunResult;
      if (candidate.provider === 'local') {
        result = runLocal(candidate, run, lastError);
      } else {
        result = await runOpenAI(candidate, run, options);
      }
      const record = createPromptRunRecord(run, result, candidate);
      await persistPromptRun(record);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = message;
    }
  }
  const fallbackPolicy: LLMPolicyModel = { provider: 'local', model: 'local-mock' };
  const fallback = runLocal(fallbackPolicy, run, lastError);
  const record = createPromptRunRecord(run, fallback, fallbackPolicy);
  await persistPromptRun(record);
  return { ...fallback, error: lastError };
}

