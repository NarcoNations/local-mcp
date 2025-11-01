import type { LLMPolicy, LLMProviderDescriptor } from "@vibelabz/api-manager";
import type { ProviderRuntimeConfig } from "../config/providers.js";

function readString(metadata: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function findProviderByModel(providers: LLMProviderDescriptor[], hint: string): LLMProviderDescriptor | undefined {
  const lowered = hint.toLowerCase();
  return providers.find((provider) =>
    provider.available && provider.models.some((model) => model.id.toLowerCase() === lowered || model.label?.toLowerCase() === lowered)
  );
}

export function createLLMPolicy(config: ProviderRuntimeConfig["llm"]): LLMPolicy {
  return ({ request, providers }) => {
    const available = providers.filter((provider) => provider.available);
    if (!available.length) return null;
    const metadata = (request.metadata ?? {}) as Record<string, unknown>;

    const hintedProvider = readString(metadata, ["provider", "providerId", "llm_provider"]);
    if (hintedProvider && available.some((provider) => provider.id === hintedProvider)) {
      return { providerId: hintedProvider, metadata: { policy: "metadata-provider" } };
    }

    const tier = readString(metadata, ["tier", "mode", "routingTier"]);
    if (tier) {
      if (tier.toLowerCase() === "local") {
        const local = available.find((provider) => provider.type === "local" || provider.id.includes("local"));
        if (local) {
          return { providerId: local.id, useCache: false, metadata: { policy: "tier-local" } };
        }
      }
      if (tier.toLowerCase() === "hosted") {
        const hosted = available.find((provider) => provider.type !== "local");
        if (hosted) {
          return { providerId: hosted.id, metadata: { policy: "tier-hosted" } };
        }
      }
    }

    const modelHint = request.model ?? request.modelHint;
    if (modelHint) {
      const match = findProviderByModel(available, modelHint);
      if (match) {
        return { providerId: match.id, model: modelHint, metadata: { policy: "model-match" } };
      }
      if (modelHint.toLowerCase().includes("local")) {
        const local = available.find((provider) => provider.type === "local" || provider.id.includes("local"));
        if (local) {
          return { providerId: local.id, metadata: { policy: "model-local" } };
        }
      }
    }

    const defaultProviderId = config.defaultProvider;
    const defaultProvider = defaultProviderId ? available.find((provider) => provider.id === defaultProviderId) : undefined;
    const fallbackProviderId = config.fallbackProvider;
    const fallbackProvider = fallbackProviderId ? available.find((provider) => provider.id === fallbackProviderId) : undefined;

    if (request.task === "chat") {
      if (defaultProvider) {
        return { providerId: defaultProvider.id, useCache: false, metadata: { policy: "task-chat" } };
      }
      if (fallbackProvider) {
        return { providerId: fallbackProvider.id, useCache: false, metadata: { policy: "task-chat-fallback" } };
      }
    }

    if (request.task === "summarize" || request.task === "analyze") {
      if (defaultProvider) {
        return {
          providerId: defaultProvider.id,
          cacheTtlSeconds: config.cacheSeconds,
          metadata: { policy: "task-analytic" },
        };
      }
    }

    if (request.task === "classify") {
      if (defaultProvider) {
        return { providerId: defaultProvider.id, metadata: { policy: "task-classify" } };
      }
      if (fallbackProvider) {
        return { providerId: fallbackProvider.id, metadata: { policy: "task-classify-fallback" } };
      }
    }

    return defaultProvider ? { providerId: defaultProvider.id, metadata: { policy: "default" } } : null;
  };
}
