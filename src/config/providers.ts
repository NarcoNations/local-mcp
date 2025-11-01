import type { AppConfig, ProviderSettings } from "../config.js";
import type {
  ApiManagerConfig,
  LLMProviderConfig,
  OpenAIProviderConfig as ManagerOpenAIProviderConfig,
  LocalProviderConfig as ManagerLocalProviderConfig,
} from "@vibelabz/api-manager";

export type ProviderRuntimeConfig = ApiManagerConfig;

function resolveOpenAIConfig(settings: ProviderSettings): ManagerOpenAIProviderConfig {
  const key =
    (settings as any).apiKey ??
    ((settings as any).apiKeyEnv ? process.env[String((settings as any).apiKeyEnv)] : undefined);
  return {
    id: settings.id,
    type: "openai",
    label: settings.label,
    description: settings.description,
    disabled: settings.disabled,
    disabledReason: settings.disabledReason,
    tags: settings.tags,
    metadata: settings.metadata,
    apiKey: key,
    apiKeyEnv: (settings as any).apiKeyEnv,
    baseUrl: (settings as any).baseUrl,
    organization: (settings as any).organization,
    defaultModel: (settings as any).defaultModel,
    models: (settings as any).models,
    temperature: (settings as any).temperature,
  };
}

function resolveLocalConfig(settings: ProviderSettings): ManagerLocalProviderConfig {
  return {
    id: settings.id,
    type: "local",
    label: settings.label,
    description: settings.description,
    disabled: settings.disabled,
    disabledReason: settings.disabledReason,
    tags: settings.tags,
    metadata: settings.metadata,
    models: (settings as any).models,
    endpoint: (settings as any).endpoint,
    defaultResponsePrefix: (settings as any).defaultResponsePrefix,
  };
}

function toManagerConfig(settings: ProviderSettings): LLMProviderConfig {
  switch (settings.type) {
    case "openai":
      return resolveOpenAIConfig(settings);
    case "local":
      return resolveLocalConfig(settings);
    default:
      return {
        id: settings.id,
        type: settings.type,
        label: settings.label,
        description: settings.description,
        disabled: settings.disabled,
        disabledReason: settings.disabledReason,
        tags: settings.tags,
        metadata: settings.metadata,
        models: (settings as any).models,
      } as LLMProviderConfig;
  }
}

function parseNumber(env?: string): number | undefined {
  if (!env) return undefined;
  const parsed = Number(env);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveProviderRuntimeConfig(config: AppConfig): ProviderRuntimeConfig {
  const llm = config.providers?.llm;
  const cacheSecondsEnv = parseNumber(process.env.MCP_LLM_CACHE_SECONDS);
  const cacheMaxEnv = parseNumber(process.env.MCP_LLM_CACHE_MAX);
  const defaultProviderEnv = process.env.MCP_DEFAULT_LLM_PROVIDER;
  const fallbackProviderEnv = process.env.MCP_FALLBACK_LLM_PROVIDER;

  const providers = (llm?.providers ?? []).map((provider) => toManagerConfig(provider));

  return {
    llm: {
      defaultProvider: defaultProviderEnv ?? llm?.defaultProvider,
      fallbackProvider: fallbackProviderEnv ?? llm?.fallbackProvider,
      cacheSeconds: cacheSecondsEnv ?? llm?.cacheSeconds,
      cache: {
        ttlSeconds: cacheSecondsEnv ?? llm?.cacheSeconds,
        maxEntries: cacheMaxEnv,
      },
      providers,
    },
  };
}
