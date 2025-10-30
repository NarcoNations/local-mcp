// EDIT HERE: update cost estimates per provider/model
export const MODEL_COSTS: Record<string, { prompt: number; completion: number }> = {
  'openai:gpt-4o': { prompt: 0.00001, completion: 0.00003 },
  'anthropic:claude-3-haiku': { prompt: 0.0000008, completion: 0.0000024 },
  'xenova:cpu': { prompt: 0, completion: 0 },
};

export function estimateCost(provider: string, model: string, tokensIn: number, tokensOut: number) {
  const key = `${provider}:${model}`;
  const costs = MODEL_COSTS[key] || MODEL_COSTS[model] || { prompt: 0.000001, completion: 0.000002 };
  return tokensIn * costs.prompt + tokensOut * costs.completion;
}
