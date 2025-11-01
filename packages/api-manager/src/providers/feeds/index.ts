import type { SupabaseClient } from '@supabase/supabase-js';
import { MemoryCache } from '../../cache';
import type { FeedRequest, FeedResponse } from '../../types';
import { fetchAlphaVantage } from './alphaVantage';
import { fetchFinnhub } from './finnhub';
import { fetchTiingo } from './tiingo';

const memoryCache = new MemoryCache<FeedResponse>();

type FetchOptions = {
  supabase?: SupabaseClient;
  ttlMs?: number;
};

type ProviderHandler = (request: FeedRequest) => Promise<FeedResponse>;

const handlers: Record<string, ProviderHandler> = {
  'alpha-vantage': fetchAlphaVantage,
  finnhub: fetchFinnhub,
  tiingo: fetchTiingo,
};

export async function fetchFeed(
  request: FeedRequest,
  options: FetchOptions = {}
): Promise<FeedResponse> {
  const provider = request.provider;
  if (provider === 'polygon') {
    return {
      provider: provider as FeedResponse['provider'],
      status: 'error',
      cached: false,
      error: 'Polygon is not available on the free tier. Please upgrade your plan.',
    };
  }
  const handler = handlers[provider];
  if (!handler) {
    return {
      provider: provider as FeedResponse['provider'],
      status: 'error',
      cached: false,
      error: `Unsupported provider: ${provider}`,
    };
  }

  const cacheKey = MemoryCache.createKey(provider, request);
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true, cacheSource: 'memory' };
  }

  const ttl = options.ttlMs ?? 60_000;
  const supabase = options.supabase;
  if (supabase) {
    try {
      const { data } = await supabase
        .from('api_cache')
        .select('payload, ts')
        .eq('cache_key', cacheKey)
        .eq('provider', provider)
        .maybeSingle();
      if (data) {
        const age = Date.now() - new Date(data.ts as string).getTime();
        if (age < ttl) {
          const payload = data.payload as FeedResponse;
          memoryCache.set(cacheKey, payload);
          return { ...payload, cached: true, cacheSource: 'supabase' };
        }
      }
    } catch (error) {
      console.warn('[api-manager] failed to read Supabase cache', error);
    }
  }

  try {
    const response = await fetchWithBackoff(() => handler(request));
    memoryCache.set(cacheKey, response);
    if (supabase) {
      supabase
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          provider,
          payload: response,
          ts: new Date().toISOString(),
        })
        .catch((error) => console.warn('[api-manager] failed to persist cache', error));
    }
    return response;
  } catch (error) {
    return {
      provider: provider as FeedResponse['provider'],
      status: 'error',
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown feed error',
    };
  }
}

async function fetchWithBackoff(fn: () => Promise<FeedResponse>) {
  const maxAttempts = 3;
  let attempt = 0;
  let delay = 500;
  while (attempt < maxAttempts) {
    try {
      const result = await fn();
      if (result.status === 'error' && result.meta?.retryable) {
        throw new Error(result.error || 'retryable error');
      }
      return result;
    } catch (error: any) {
      attempt += 1;
      if (attempt >= maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Exceeded retry attempts');
}
