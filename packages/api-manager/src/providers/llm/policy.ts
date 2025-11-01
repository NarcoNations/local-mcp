import { promises as fs } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { LLMPolicyConfig } from '../../types.js';

const PolicyModelSchema = z.object({
  provider: z.enum(['openai', 'local']),
  model: z.string(),
  maxCost: z.number().optional(),
  maxLatencyMs: z.number().optional(),
  fallback: z.string().optional(),
});

const PolicySchema = z.object({
  tasks: z.record(z.string(), z.object({
    primary: PolicyModelSchema,
    secondary: PolicyModelSchema.optional(),
    local: PolicyModelSchema.optional(),
  })),
});

const DEFAULT_POLICY: LLMPolicyConfig = {
  tasks: {
    default: {
      primary: { provider: 'openai', model: 'gpt-4o-mini', maxCost: 0.02, maxLatencyMs: 15000 },
      local: { provider: 'local', model: 'local-mock' },
    },
    summarize: {
      primary: { provider: 'openai', model: 'gpt-4o-mini', maxCost: 0.015, maxLatencyMs: 12000 },
      secondary: { provider: 'openai', model: 'gpt-4o-mini', maxCost: 0.02 },
      local: { provider: 'local', model: 'local-mock' },
    },
    draft_copy: {
      primary: { provider: 'openai', model: 'gpt-4o-mini', maxCost: 0.02, maxLatencyMs: 18000 },
      local: { provider: 'local', model: 'local-mock' },
    },
    classify: {
      primary: { provider: 'openai', model: 'gpt-4o-mini', maxCost: 0.01, maxLatencyMs: 8000 },
      local: { provider: 'local', model: 'local-mock' },
    },
  },
};

let cachedPolicy: LLMPolicyConfig | null = null;

function getPolicyPaths(): string[] {
  const custom = process.env.LLM_POLICY_PATH;
  const base = path.resolve(process.cwd(), 'config/llm-routing');
  return [
    custom ? path.resolve(process.cwd(), custom) : '',
    path.join(base, 'policy.yaml'),
    path.join(base, 'policy.yml'),
    path.join(base, 'policy.json'),
  ].filter(Boolean);
}

async function readPolicyFile(): Promise<LLMPolicyConfig | null> {
  for (const filePath of getPolicyPaths()) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const data = filePath.endsWith('.json') ? JSON.parse(raw) : YAML.parse(raw);
      const parsed = PolicySchema.parse(data);
      return parsed as LLMPolicyConfig;
    } catch (error: any) {
      if (error?.code === 'ENOENT') continue;
      console.warn(`llm-policy: failed to read ${filePath}:`, error?.message ?? error);
    }
  }
  return null;
}

export async function loadPolicy(): Promise<LLMPolicyConfig> {
  if (cachedPolicy) return cachedPolicy;
  const loaded = await readPolicyFile();
  cachedPolicy = loaded ?? DEFAULT_POLICY;
  return cachedPolicy;
}

export function resetPolicyCache() {
  cachedPolicy = null;
}

