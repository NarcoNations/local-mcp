import { BaseLLMProvider } from "./base";
import {
  LLMProvider,
  LLMProviderDescriptor,
  LLMRunRequest,
  LLMRunResult,
  OpenAIProviderConfig,
  ProviderInvokeOptions,
} from "../../types";

interface CreateOpenAIProviderResult {
  descriptor: LLMProviderDescriptor;
  provider: LLMProvider | null;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export function createOpenAIProvider(config: OpenAIProviderConfig): CreateOpenAIProviderResult {
  const available = !config.disabled && Boolean(config.apiKey);
  const disabledReason = config.disabled
    ? config.disabledReason ?? "Provider disabled via configuration"
    : config.apiKey
      ? undefined
      : "API key missing";
  const modelIds = (config.models && config.models.length ? config.models : [config.defaultModel ?? DEFAULT_MODEL]).filter(Boolean);
  const descriptor: LLMProviderDescriptor = {
    id: config.id,
    type: "openai",
    label: config.label ?? "OpenAI",
    description: config.description ?? "OpenAI Chat Completions API",
    available: available && modelIds.length > 0,
    disabledReason: modelIds.length === 0 ? "No models configured" : disabledReason,
    models: modelIds.map((id) => ({ id, label: id })),
    tags: [...(config.tags ?? []), "hosted"],
    metadata: {
      ...(config.metadata ?? {}),
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      organization: config.organization,
    },
  };

  if (!descriptor.available) {
    return { descriptor, provider: null };
  }

  class OpenAIProvider extends BaseLLMProvider {
    constructor() {
      super(descriptor);
    }

    async invoke(request: LLMRunRequest, options?: ProviderInvokeOptions): Promise<LLMRunResult> {
      const started = Date.now();
      const model = request.model ?? request.modelHint ?? modelIds[0];
      const metadata = request.metadata ?? {};
      const metadataMessages = Array.isArray((metadata as any).messages)
        ? ((metadata as any).messages as Array<{ role: string; content: string }>)
        : undefined;
      const systemPrompt = typeof (metadata as any).systemPrompt === "string" ? String((metadata as any).systemPrompt) : undefined;
      const temperature = typeof (metadata as any).temperature === "number"
        ? (metadata as any).temperature as number
        : config.temperature ?? 0.7;

      const messages = metadataMessages ?? [
        { role: "system", content: systemPrompt ?? `You are assisting with task: ${request.task}.` },
        { role: "user", content: request.prompt },
      ];

      const body = {
        model,
        messages,
        temperature,
        user: request.user,
      };

      const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: options?.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...(config.organization ? { "OpenAI-Organization": config.organization } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await safeJson(response);
        throw new Error(`OpenAI request failed (${response.status}): ${errorBody?.error?.message ?? response.statusText}`);
      }

      const json = await response.json();
      const choice = json.choices?.[0];
      const usage = json.usage ?? {};

      const durationMs = Date.now() - started;
      const result: LLMRunResult = {
        providerId: descriptor.id,
        providerLabel: descriptor.label,
        model,
        output: choice?.message?.content ?? "",
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        raw: json,
        durationMs,
      };

      return result;
    }
  }

  return { descriptor, provider: new OpenAIProvider() };
}

async function safeJson(response: Response): Promise<any | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
