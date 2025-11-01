import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LLMPolicyModel, LLMRun, LLMRunResult, PromptRunRecord } from '../../types.js';

const DEFAULT_LOG_PATH = path.resolve(process.cwd(), '.mcp-nn/prompt-runs.jsonl');
const TABLE_NAME = process.env.PROMPT_RUNS_TABLE ?? 'prompt_runs';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabase;
}

function ensurePreview(text?: string) {
  if (!text) return '';
  return text.slice(0, 240);
}

export function createPromptRunRecord(run: LLMRun, result: LLMRunResult, policy: LLMPolicyModel): PromptRunRecord {
  const promptHash = createHash('sha1').update(run.prompt).digest('hex');
  return {
    id: randomUUID(),
    task: run.task,
    model: result.model,
    provider: result.provider,
    promptHash,
    costEst: result.costEst,
    latencyMs: result.latencyMs,
    ok: !result.error,
    outputPreview: ensurePreview(result.output),
    createdAt: new Date().toISOString(),
    meta: {
      hint: run.modelHint ?? null,
      policyModel: policy.model,
    },
  };
}

async function persistToSupabase(record: PromptRunRecord) {
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.from(TABLE_NAME).insert({
    id: record.id,
    task: record.task,
    model: record.model,
    provider: record.provider,
    prompt_hash: record.promptHash,
    cost_est: record.costEst,
    latency_ms: record.latencyMs,
    ok: record.ok,
    output_preview: record.outputPreview,
    created_at: record.createdAt,
    meta: record.meta ?? {},
  });
  if (error) {
    console.warn('prompt-runs: failed to persist to supabase', error.message);
    return false;
  }
  return true;
}

async function persistToFile(record: PromptRunRecord) {
  const filePath = process.env.PROMPT_RUNS_LOG ?? DEFAULT_LOG_PATH;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

export async function persistPromptRun(record: PromptRunRecord) {
  const stored = await persistToSupabase(record);
  if (stored) return;
  await persistToFile(record);
}

export function estimateCost(policy: LLMPolicyModel, prompt: string, output?: string) {
  const promptTokens = Math.ceil(prompt.length / 4);
  const outputTokens = output ? Math.ceil(output.length / 4) : 0;
  const tokenCost = (promptTokens + outputTokens) * 0.0000005;
  const max = policy.maxCost ?? 0.02;
  return Number(Math.min(tokenCost, max).toFixed(6));
}

