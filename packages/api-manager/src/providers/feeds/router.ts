import { FeedRequest, FeedRequestSchema, FeedResult, FeedResourceSchema, ProviderError, ProviderId } from '../../types.js';
import { MemoryCache } from '../../cache/memory.js';
import type { ProviderContext, ProviderExecutionContext, ProviderRegistry } from './types.js';
import { alphaProvider } from './alphaVantage.js';
import { finnhubProvider } from './finnhub.js';
import { tiingoProvider } from './tiingo.js';
import { polygonProvider } from './polygon.js';

const DEFAULT_TTL = 60;

const providers: ProviderRegistry = {
  alpha: alphaProvider,
  finnhub: finnhubProvider,
  tiingo: tiingoProvider,
  polygon: polygonProvider,
};

export interface FeedRouterOptions extends ProviderContext {}

function normaliseRequest(raw: FeedRequest): FeedRequest {
  const parsed = FeedRequestSchema.parse(raw);
  const resource = FeedResourceSchema.parse(parsed.resource);
  return { ...parsed, resource };
}

function resolveCache(options?: FeedRouterOptions) {
  if (options?.cache) return options.cache;
  return new MemoryCache();
}

function getCacheKey(req: FeedRequest) {
  const keyParts = [req.provider, req.resource, req.symbol];
  if (req.range) keyParts.push(req.range);
  if (req.interval) keyParts.push(req.interval);
  return keyParts.join('::');
}

export async function routeFeed(rawRequest: FeedRequest, options?: FeedRouterOptions): Promise<FeedResult> {
  const request = normaliseRequest(rawRequest);
  const provider = providers[request.provider];
  if (!provider) {
    throw new ProviderError(`Unknown provider: ${request.provider}`);
  }

  const cache = resolveCache(options);
  const key = getCacheKey(request);

  if (!request.forceRefresh) {
    const cached = await cache.get<FeedResult>(key);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  const fetcher = options?.fetcher ?? fetch;
  const execContext: ProviderExecutionContext = {
    fetcher,
    cache,
    ttlSeconds: options?.ttlSeconds ?? DEFAULT_TTL,
    request,
  };

  let result: FeedResult;
  switch (request.resource) {
    case 'quote': {
      if (!provider.getQuote) throw new ProviderError(`${provider.name} does not support quotes`);
      result = await provider.getQuote(request.symbol, execContext);
      break;
    }
    case 'timeseries': {
      if (!provider.getTimeseries) throw new ProviderError(`${provider.name} does not support timeseries`);
      result = await provider.getTimeseries(request.symbol, request, execContext);
      break;
    }
    case 'company': {
      if (!provider.getCompany) throw new ProviderError(`${provider.name} does not support company profiles`);
      result = await provider.getCompany(request.symbol, execContext);
      break;
    }
    default: {
      throw new ProviderError(`Unsupported resource ${request.resource}`);
    }
  }

  const enriched: FeedResult = {
    ...result,
    cached: false,
    receivedAt: result.receivedAt ?? new Date().toISOString(),
  };
  await cache.set(key, enriched, execContext.ttlSeconds);
  return enriched;
}

export function listProviders(): { id: ProviderId; name: string; supports: ProviderRegistry[ProviderId]['supports'] }[] {
  return Object.values(providers).map((provider) => ({
    id: provider.id,
    name: provider.name,
    supports: provider.supports,
  }));
}

