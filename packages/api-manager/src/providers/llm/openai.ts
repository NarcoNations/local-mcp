import type {
  LLMProvider,
  LLMRequest,
  LLMProviderContext,
  NormalizedLLMResponse,
} from '../../types.js';

export class OpenAIProvider implements LLMProvider {
  readonly metadata = {
    id: 'openai',
    label: 'OpenAI',
    description: 'OpenAI Chat Completions API',
  } as const;

  supports(_request: LLMRequest): boolean {
    return true;
  }

  async invoke(request: LLMRequest, context: LLMProviderContext): Promise<NormalizedLLMResponse> {
    const apiKey = context.credentials.openai?.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key missing');
    }
    const started = Date.now();
    const baseUrl = context.credentials.openai?.baseUrl ?? 'https://api.openai.com/v1';
    const payload = {
      model: request.modelHint ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    };

    const res = await (context.fetchImpl ?? fetch)(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed (${res.status})`);
    }
    const json = await res.json();
    const latencyMs = Date.now() - started;
    return {
      providerId: this.metadata.id,
      model: json.model ?? payload.model,
      task: request.task,
      output: json.choices?.[0]?.message?.content ?? '',
      latencyMs,
      usage: json.usage ?? undefined,
      raw: json,
      policyId: request.policyId,
    };
  }
}

export function createOpenAIProvider(): LLMProvider {
  return new OpenAIProvider();
}
