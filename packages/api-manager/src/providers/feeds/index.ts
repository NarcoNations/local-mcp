import { TtlCache } from '../../cache.js';
import type {
  FeedProvider,
  FeedRequest,
  NormalizedFeedResponse,
  ProviderCredentials,
  FeedProviderContext,
  FeedCachingConfig,
} from '../../types.js';
import { createAlphaVantageProvider } from './alphaVantage.js';
import { createStaticFeedProvider } from './static.js';

export interface FeedManagerOptions {
  credentials: ProviderCredentials;
  providers?: FeedProvider[];
  caching?: FeedCachingConfig;
  fetchImpl?: typeof fetch;
}

export class FeedManager {
  private readonly providers = new Map<string, FeedProvider>();
  private cache: TtlCache<NormalizedFeedResponse> | null = null;
  private cachingConfig: FeedCachingConfig = { enabled: true, ttlSeconds: 60 };

  constructor(private options: FeedManagerOptions) {
    const defaults = options.providers ?? [createStaticFeedProvider(), createAlphaVantageProvider()];
    defaults.forEach((provider) => this.registerProvider(provider));
    if (options.caching) {
      this.setCaching(options.caching);
    }
  }

  registerProvider(provider: FeedProvider): void {
    this.providers.set(provider.metadata.id, provider);
  }

  setCaching(config: FeedCachingConfig): void {
    this.cachingConfig = config;
    if (config.enabled) {
      this.cache = new TtlCache<NormalizedFeedResponse>(config.ttlSeconds * 1000);
    } else {
      this.cache = null;
    }
  }

  updateCredentials(credentials: ProviderCredentials): void {
    this.options.credentials = credentials;
  }

  updateOptions(options: Partial<Pick<FeedManagerOptions, 'credentials' | 'caching' | 'fetchImpl'>>): void {
    if (options.credentials) {
      this.updateCredentials(options.credentials);
    }
    if (options.caching) {
      this.setCaching(options.caching);
    }
    if (options.fetchImpl) {
      this.options.fetchImpl = options.fetchImpl;
    }
  }

  async fetch(request: FeedRequest): Promise<NormalizedFeedResponse> {
    const provider = this.resolveProvider(request);
    const cacheKey = `${provider.metadata.id}:${request.dataset}:${request.symbol.toUpperCase()}`;
    if (!request.forceRefresh && this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return structuredClone(cached);
      }
    }

    const context: FeedProviderContext = {
      credentials: this.options.credentials,
      fetchImpl: this.options.fetchImpl,
    };

    const response = await provider.fetch(request, context);
    if (this.cache && response.cacheTtlSeconds && response.cacheTtlSeconds > 0) {
      this.cache.set(cacheKey, structuredClone(response), response.cacheTtlSeconds * 1000);
    } else if (this.cache) {
      this.cache.set(cacheKey, structuredClone(response));
    }
    return response;
  }

  listProviders(): FeedProvider[] {
    return Array.from(this.providers.values());
  }

  private resolveProvider(request: FeedRequest): FeedProvider {
    if (request.providerId) {
      const provider = this.providers.get(request.providerId);
      if (!provider) {
        throw new Error(`Unknown feed provider: ${request.providerId}`);
      }
      if (!provider.supports(request)) {
        throw new Error(`Provider ${request.providerId} cannot handle dataset ${request.dataset}`);
      }
      return provider;
    }
    for (const provider of this.providers.values()) {
      if (provider.supports(request)) {
        return provider;
      }
    }
    throw new Error(`No feed provider available for dataset ${request.dataset}`);
  }
}

export function createFeedManager(options: FeedManagerOptions): FeedManager {
  return new FeedManager(options);
}
