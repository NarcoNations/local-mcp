import fs from 'fs';
import path from 'path';

export type ModelPreference = {
  prefer: string[];
  fallback?: string[];
  maxCost?: number;
  maxLatencyMs?: number;
};

export type LLMPolicy = {
  defaults: ModelPreference;
  tasks: Record<string, ModelPreference>;
};

let cachedPolicy: LLMPolicy | null = null;

function defaultPolicy(): LLMPolicy {
  return {
    defaults: {
      prefer: ['openai:gpt-4o-mini'],
      fallback: ['local:mock'],
      maxCost: 0.5,
      maxLatencyMs: 20_000,
    },
    tasks: {
      draft_copy: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.5 },
      summarize: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.3 },
      classify: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.1 },
      research_plan: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.8 },
      narrative_draft: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.8 },
      code_review: { prefer: ['openai:gpt-4o-mini'], fallback: ['local:mock'], maxCost: 0.6 },
    },
  };
}

export function getPolicy(): LLMPolicy {
  if (cachedPolicy) return cachedPolicy;
  const policyPath = process.env.LLM_POLICY_PATH || path.join(process.cwd(), 'examples/next-adapter/config/llm-routing/policy.json');
  try {
    const file = fs.readFileSync(policyPath, 'utf8');
    const parsed = JSON.parse(file);
    cachedPolicy = {
      defaults: { ...defaultPolicy().defaults, ...(parsed.defaults ?? {}) },
      tasks: { ...defaultPolicy().tasks, ...(parsed.tasks ?? {}) },
    };
    return cachedPolicy;
  } catch (error) {
    cachedPolicy = defaultPolicy();
    return cachedPolicy;
  }
}

export function chooseModel(task: string, hint?: string) {
  const policy = getPolicy();
  const pref = policy.tasks[task] ?? policy.defaults;
  const hintValue = (hint || '').toLowerCase();
  if (hintValue.includes('local')) {
    return pref.fallback?.[0] ?? 'local:mock';
  }
  return pref.prefer[0] ?? policy.defaults.prefer[0];
}
