import {
  LLMProviderConfig,
  LLMProviderDescriptor,
  OpenAIProviderConfig,
  LocalProviderConfig,
} from "../../types";
import { createOpenAIProvider } from "./openai";
import { createLocalProvider } from "./local";

export interface LLMProviderRegistration {
  descriptor: LLMProviderDescriptor;
  provider: import("../../types").LLMProvider | null;
}

function isOpenAIConfig(config: LLMProviderConfig): config is OpenAIProviderConfig {
  return config.type === "openai";
}

function isLocalConfig(config: LLMProviderConfig): config is LocalProviderConfig {
  return config.type === "local";
}

export function instantiateLLMProviders(configs: LLMProviderConfig[]): LLMProviderRegistration[] {
  return configs.map((config) => {
    if (isOpenAIConfig(config)) {
      return createOpenAIProvider(config);
    }
    if (isLocalConfig(config)) {
      return createLocalProvider(config);
    }
    const descriptor: LLMProviderDescriptor = {
      id: config.id,
      type: config.type,
      label: config.label ?? `${config.type} provider`,
      description: config.description ?? "Custom provider (no adapter registered)",
      available: false,
      disabledReason: config.disabledReason ?? "No adapter available",
      models: (config as any).models?.map((id: string) => ({ id, label: id })) ?? [],
      tags: config.tags ?? [],
      metadata: config.metadata ?? {},
    };
    return { descriptor, provider: null };
  });
}
