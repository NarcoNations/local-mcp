import { LLMProvider, LLMRun, ProviderContext } from '../../types.js';
import { ProviderError } from '../../utils.js';

export interface OpenAIProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
}

interface OpenAIChoice {
  message?: {
    content?: string;
  };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    [key: string]: unknown;
  };
}

export function createOpenAIProvider(options: OpenAIProviderOptions = {}): LLMProvider {
  const defaultModel = options.model ?? 'gpt-4o-mini';
  const baseUrl = options.baseUrl ?? 'https://api.openai.com/v1/chat/completions';
  return {
    name: 'openai',
    supports(run: LLMRun) {
      const hint = run.modelHint?.toLowerCase() ?? '';
      return !hint.includes('local');
    },
    priority(run: LLMRun) {
      const hint = run.modelHint?.toLowerCase() ?? '';
      if (hint.includes('gpt') || hint.includes('openai')) return 50;
      return 10;
    },
    async invoke(run: LLMRun, context: ProviderContext = {}) {
      const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new ProviderError('OPENAI_API_KEY not set', 'CONFIG_MISSING');
      }

      const model = run.modelHint ?? defaultModel;
      const body = {
        model,
        messages: [{ role: 'user', content: `${run.task}: ${run.prompt}` }],
        temperature: 0.7,
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(options.organization ? { 'OpenAI-Organization': options.organization } : {}),
        },
        body: JSON.stringify(body),
        signal: context.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new ProviderError(`OpenAI request failed (${response.status})`, 'HTTP_ERROR', {
          status: response.status,
          body: safeJsonParse(text),
        });
      }

      const data = (await response.json()) as OpenAIResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new ProviderError('OpenAI response missing content', 'EMPTY_RESPONSE', data);
      }

      const usage = data.usage;
      return {
        model,
        output: content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
              raw: usage,
            }
          : undefined,
      };
    },
  } satisfies LLMProvider;
}

function safeJsonParse(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
