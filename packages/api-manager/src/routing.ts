import { FeedProvider, FeedRequest, LLMProvider, LLMRun, RoutingPolicy } from './types.js';

async function sortByPriority<TProvider, TRequest>(
  request: TRequest,
  providers: readonly TProvider[],
  getPriority: (provider: TProvider, request: TRequest) => number | Promise<number>
): Promise<readonly TProvider[]> {
  const withPriority = await Promise.all(
    providers.map(async (provider) => ({ provider, priority: await getPriority(provider, request) }))
  );
  return withPriority
    .sort((a, b) => b.priority - a.priority)
    .map((entry) => entry.provider);
}

export class DefaultLLMRoutingPolicy implements RoutingPolicy<LLMRun, LLMProvider> {
  async select(run: LLMRun, providers: readonly LLMProvider[]): Promise<readonly LLMProvider[]> {
    const supported = [] as LLMProvider[];
    for (const provider of providers) {
      if (await provider.supports(run)) {
        supported.push(provider);
      }
    }
    if (!supported.length) return [];
    return sortByPriority(run, supported, (provider, request) => provider.priority?.(request) ?? 0);
  }
}

export class DefaultFeedRoutingPolicy implements RoutingPolicy<FeedRequest, FeedProvider> {
  async select(request: FeedRequest, providers: readonly FeedProvider[]): Promise<readonly FeedProvider[]> {
    const supported = [] as FeedProvider[];
    for (const provider of providers) {
      if (await provider.supports(request)) {
        supported.push(provider);
      }
    }
    if (!supported.length) return [];
    return sortByPriority(request, supported, (provider, req) => provider.priority?.(req) ?? 0);
  }
}
