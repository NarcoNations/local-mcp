import { performance } from 'node:perf_hooks';
import { LRUCache } from '../../cache';
import type { FeedOptions, FeedRequest, FeedResult } from '../../types';
import { readSupabaseCache, writeSupabaseCache } from '../../utils';
import { fetchAlphaVantage } from './alphaVantage';
import { fetchFinnhub } from './finnhub';
import { fetchTiingo } from './tiingo';
import { fetchPolygon } from './polygon';

let memoryCache = new LRUCache<FeedResult>();
let memoryCacheMax = 150;

const providers = {
  alphaVantage: fetchAlphaVantage,
  finnhub: fetchFinnhub,
  tiingo: fetchTiingo,
  polygon: fetchPolygon
} as const;

export async function fetchFeed(request: FeedRequest, options: FeedOptions = {}): Promise<FeedResult> {
  const providerFn = providers[request.provider];
  if (!providerFn) {
    return {
      provider: request.provider,
      kind: request.kind,
      meta: {
        cache: 'none',
        cached: false,
        key: `${request.provider}:${request.kind}:${request.symbol}`,
        requestedAt: new Date().toISOString(),
        latencyMs: 0,
        status: 400
      },
      error: { message: 'Unsupported provider' }
    };
  }

  const ttl = options.ttlMs ?? 60_000;
  const desiredMax = options.maxEntries ?? memoryCacheMax;
  if (desiredMax !== memoryCacheMax) {
    memoryCache = new LRUCache<FeedResult>(desiredMax, ttl);
    memoryCacheMax = desiredMax;
  }
  const key = [options.cacheKeyPrefix ?? 'feed', request.provider, request.kind, request.symbol, request.interval ?? '', request.range ?? '']
    .filter(Boolean)
    .join('::');

  const cached = memoryCache.get(key);
  if (cached) {
    return {
      ...cached,
      meta: { ...cached.meta, cache: 'memory', cached: true, key, latencyMs: 0 }
    };
  }

  const supabaseConfig = options.supabase ?? inferSupabase();
  if (supabaseConfig) {
    const cachedSupabase = await readSupabaseCache(supabaseConfig, request.provider, key);
    if (cachedSupabase) {
      const meta = {
        cache: 'supabase' as const,
        cached: true,
        key,
        requestedAt: new Date().toISOString(),
        latencyMs: 0,
        status: Number(cachedSupabase?.meta?.status ?? 200)
      };
      const result: FeedResult = { provider: request.provider, kind: request.kind, data: cachedSupabase.data, meta };
      memoryCache.set(key, result, ttl);
      return result;
    }
  }

  const start = performance.now();
  const result = await providerFn(request);
  const latencyMs = Math.round(performance.now() - start);
  const hydrated: FeedResult = {
    ...result,
    meta: { ...result.meta, cache: result.meta.cache ?? 'network', cached: false, key, latencyMs }
  };

  if (!hydrated.error && hydrated.data) {
    memoryCache.set(key, hydrated, ttl);
    if (supabaseConfig) {
      await writeSupabaseCache(supabaseConfig, request.provider, key, { data: hydrated.data, meta: hydrated.meta }, hydrated.meta.status);
    }
  }

  return hydrated;
}

function inferSupabase(): FeedOptions['supabase'] {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return { url, serviceKey: key };
  return null;
}
