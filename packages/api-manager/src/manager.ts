import {
  ApiManager,
  ApiManagerConfig,
  ApiManagerOptions,
  LLMPolicyDecision,
  LLMProviderDescriptor,
  LLMRunRequest,
  LLMRunResult,
} from "./types";
import { createMemoryCache, createCacheKey } from "./cache";
import { instantiateLLMProviders } from "./providers/llm";

function cloneResult<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createApiManager(config: ApiManagerConfig, options?: ApiManagerOptions): ApiManager {
  const registrations = instantiateLLMProviders(config.llm.providers ?? []);
  const descriptorMap = new Map<string, LLMProviderDescriptor>();
  const providerMap = new Map<string, import("./types").LLMProvider>();
  for (const registration of registrations) {
    descriptorMap.set(registration.descriptor.id, registration.descriptor);
    if (registration.provider) {
      providerMap.set(registration.descriptor.id, registration.provider);
    }
  }

  const cache = options?.cache ?? createMemoryCache<LLMRunResult>({ maxEntries: config.llm.cache?.maxEntries ?? 200 });
  const defaultCacheTtl = config.llm.cache?.ttlSeconds ?? config.llm.cacheSeconds ?? 120;

  function listProviders({ includeUnavailable = false }: { includeUnavailable?: boolean } = {}): LLMProviderDescriptor[] {
    return registrations
      .filter((registration) => includeUnavailable || registration.descriptor.available)
      .map((registration) => ({ ...registration.descriptor }));
  }

  async function applyPolicy(request: LLMRunRequest): Promise<{ decision: LLMPolicyDecision | null; request: LLMRunRequest }> {
    if (!options?.llmPolicy) {
      return { decision: null, request };
    }
    const decision = await options.llmPolicy({ request, providers: listProviders({ includeUnavailable: true }) });
    if (!decision) {
      return { decision: null, request };
    }
    const merged: LLMRunRequest = {
      ...request,
      providerId: decision.providerId ?? request.providerId,
      model: decision.model ?? request.model,
      modelHint: decision.model ?? request.modelHint,
      metadata: {
        ...(request.metadata ?? {}),
        ...(decision.metadata ?? {}),
      },
      useCache: decision.useCache ?? request.useCache,
      cacheKey: decision.cacheKey ?? request.cacheKey,
      cacheTtlSeconds: decision.cacheTtlSeconds ?? request.cacheTtlSeconds,
    };
    return { decision, request: merged };
  }

  function chooseProvider(request: LLMRunRequest): { descriptor: LLMProviderDescriptor; provider: import("./types").LLMProvider } {
    const descriptors = listProviders({ includeUnavailable: true });
    const available = descriptors.filter((descriptor) => descriptor.available && providerMap.has(descriptor.id));
    if (!available.length) {
      throw new Error("No available LLM providers are configured");
    }

    const attemptIds: Array<string | undefined> = [
      request.providerId,
      request.model,
      request.modelHint,
      config.llm.defaultProvider,
      config.llm.fallbackProvider,
    ];

    for (const id of attemptIds) {
      if (!id) continue;
      const normalizedId = id.toString();
      const provider = providerMap.get(normalizedId);
      if (provider) {
        return { descriptor: descriptorMap.get(normalizedId)!, provider };
      }
      const matchingByModel = available.find((descriptor) =>
        descriptor.models.some((model) => model.id === normalizedId || model.label?.toLowerCase() === normalizedId.toLowerCase())
      );
      if (matchingByModel) {
        const candidate = providerMap.get(matchingByModel.id);
        if (candidate) {
          return { descriptor: matchingByModel, provider: candidate };
        }
      }
    }

    const first = available[0]!;
    return { descriptor: first, provider: providerMap.get(first.id)! };
  }

  async function runLLM(request: LLMRunRequest, runOptions?: { signal?: AbortSignal }): Promise<LLMRunResult> {
    if (!request.prompt || !request.task) {
      throw new Error("LLM run requires both a task and prompt");
    }

    const { decision, request: withPolicy } = await applyPolicy({ ...request });
    const { descriptor, provider } = chooseProvider(withPolicy);

    const cacheKey = withPolicy.useCache === false
      ? undefined
      : (withPolicy.cacheKey ?? decision?.cacheKey ?? createCacheKey([
          descriptor.id,
          withPolicy.task,
          withPolicy.model ?? withPolicy.modelHint,
          withPolicy.prompt,
          JSON.stringify(withPolicy.metadata ?? {}),
        ]));

    const cacheTtl = withPolicy.cacheTtlSeconds ?? decision?.cacheTtlSeconds ?? defaultCacheTtl;
    const useCache = withPolicy.useCache !== false && Boolean(cacheKey);

    if (useCache && cacheKey) {
      const cached = await Promise.resolve(cache.get(cacheKey));
      if (cached) {
        const cloned = cloneResult(cached);
        cloned.cached = true;
        cloned.usage = { ...(cloned.usage ?? {}), cached: true };
        return cloned;
      }
    }

    const result = await provider.invoke(
      { ...withPolicy, providerId: descriptor.id, model: withPolicy.model ?? withPolicy.modelHint },
      { signal: runOptions?.signal, metadata: withPolicy.metadata }
    );
    result.providerId = descriptor.id;
    result.providerLabel = descriptor.label;
    result.model = result.model ?? withPolicy.model ?? withPolicy.modelHint ?? descriptor.models[0]?.id ?? "unknown";
    result.cached = false;
    result.usage = { ...(result.usage ?? {}), cached: false };

    if (useCache && cacheKey) {
      await Promise.resolve(cache.set(cacheKey, cloneResult(result), cacheTtl));
    }

    return result;
  }

  return {
    listLLMProviders: listProviders,
    runLLM,
  };
}
