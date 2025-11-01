import { createApiManager, type ApiManager, type ApiManagerOptions } from "@vibelabz/api-manager";
import type { AppConfig } from "../config.js";
import { resolveProviderRuntimeConfig } from "../config/providers.js";
import { createLLMPolicy } from "../policy/llm.js";

export function createRuntimeApiManager(config: AppConfig, options?: ApiManagerOptions): ApiManager {
  const providerConfig = resolveProviderRuntimeConfig(config);
  const policy = createLLMPolicy(providerConfig.llm);
  return createApiManager(providerConfig, { ...options, llmPolicy: options?.llmPolicy ?? policy });
}
