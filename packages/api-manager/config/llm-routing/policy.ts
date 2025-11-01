export type ModelProvider = 'openai' | 'anthropic' | 'local';

type PolicyModel = {
  id: string;
  provider: ModelProvider;
  maxTokens: number;
  costPer1kTokens: number;
  latencyTargetMs: number;
};

type TaskPolicy = {
  prefer: string[];
  fallback: string[];
  maxCostPerCall: number;
  maxLatencyMs: number;
};

export const MODELS: Record<string, PolicyModel> = {
  'openai:gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    maxTokens: 16_000,
    costPer1kTokens: 0.15,
    latencyTargetMs: 15_000
  },
  'openai:gpt-4o-mini-128k': {
    id: 'gpt-4o-mini-128k',
    provider: 'openai',
    maxTokens: 128_000,
    costPer1kTokens: 0.18,
    latencyTargetMs: 20_000
  },
  'anthropic:claude-3-haiku': {
    id: 'claude-3-haiku',
    provider: 'anthropic',
    maxTokens: 18_000,
    costPer1kTokens: 0.25,
    latencyTargetMs: 18_000
  },
  'local:minilm': {
    id: 'MiniLM-L6-v2',
    provider: 'local',
    maxTokens: 4_096,
    costPer1kTokens: 0,
    latencyTargetMs: 4_000
  }
};

export const TASK_POLICIES: Record<string, TaskPolicy> = {
  summarize: {
    prefer: ['openai:gpt-4o-mini', 'anthropic:claude-3-haiku'],
    fallback: ['local:minilm'],
    maxCostPerCall: 0.4,
    maxLatencyMs: 18_000
  },
  draft_copy: {
    prefer: ['openai:gpt-4o-mini-128k', 'openai:gpt-4o-mini'],
    fallback: ['local:minilm'],
    maxCostPerCall: 0.65,
    maxLatencyMs: 22_000
  },
  plan: {
    prefer: ['anthropic:claude-3-haiku', 'openai:gpt-4o-mini'],
    fallback: ['local:minilm'],
    maxCostPerCall: 0.5,
    maxLatencyMs: 20_000
  },
  narrative: {
    prefer: ['openai:gpt-4o-mini-128k'],
    fallback: ['openai:gpt-4o-mini', 'local:minilm'],
    maxCostPerCall: 0.8,
    maxLatencyMs: 24_000
  },
  analysis: {
    prefer: ['openai:gpt-4o-mini'],
    fallback: ['local:minilm'],
    maxCostPerCall: 0.45,
    maxLatencyMs: 18_000
  },
  classify: {
    prefer: ['openai:gpt-4o-mini'],
    fallback: ['local:minilm'],
    maxCostPerCall: 0.2,
    maxLatencyMs: 8_000
  }
};

export const DEFAULT_FALLBACK = 'local:minilm';
