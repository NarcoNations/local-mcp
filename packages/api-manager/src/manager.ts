import {
  ApiManagerOptions,
  CacheAdapter,
  FeedProvider,
  FeedRequest,
  FeedResponse,
  LLMProvider,
  LLMRun,
  LLMRunResult,
  NormalizedFeedError,
  NormalizedFeedSuccess,
  NormalizedLLMError,
  NormalizedLLMSuccess,
  ProviderAttemptError,
  ProviderContext,
  RoutingPolicy,
} from './types.js';
import { ensureCacheAdapter } from './cache.js';
import { DefaultFeedRoutingPolicy, DefaultLLMRoutingPolicy } from './routing.js';
import { asProviderError, stableStringify } from './utils.js';

export class ApiManager {
  private readonly llmProviders: readonly LLMProvider[];
  private readonly feedProviders: readonly FeedProvider[];
  private readonly llmPolicy: RoutingPolicy<LLMRun, LLMProvider>;
  private readonly feedPolicy: RoutingPolicy<FeedRequest, FeedProvider>;
  private readonly cache: CacheAdapter | undefined;
  private readonly llmCache: CacheAdapter | undefined;
  private readonly feedCache: CacheAdapter | undefined;
  private readonly logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

  constructor(options: ApiManagerOptions = {}) {
    this.llmProviders = options.llm?.providers ?? [];
    this.feedProviders = options.feeds?.providers ?? [];
    this.llmPolicy = options.llm?.policy ?? new DefaultLLMRoutingPolicy();
    this.feedPolicy = options.feeds?.policy ?? new DefaultFeedRoutingPolicy();
    this.logger = options.logger;

    this.cache = ensureCacheAdapter(options.cache);
    this.llmCache = options.llm?.cache === undefined ? this.cache : ensureCacheAdapter(options.llm.cache);
    this.feedCache = options.feeds?.cache === undefined ? this.cache : ensureCacheAdapter(options.feeds.cache);
  }

  withLogger(logger: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>): ApiManager {
    return new ApiManager({
      ...this.serializeOptions(),
      logger,
    });
  }

  getProviders() {
    return {
      llm: this.llmProviders,
      feeds: this.feedProviders,
    };
  }

  async runLLM(run: LLMRun, context: ProviderContext = {}): Promise<LLMRunResult> {
    const key = `llm:${stableStringify(run)}`;
    const cache = !run.disableCache ? this.llmCache : undefined;
    if (cache) {
      const cached = cache.get<NormalizedLLMSuccess>(key);
      if (cached) {
        return { ...cached, cached: true } satisfies NormalizedLLMSuccess;
      }
    }

    const providers = await this.llmPolicy.select(run, this.llmProviders);
    if (!providers.length) {
      return {
        ok: false,
        error: 'No LLM provider available for request',
        code: 'NO_PROVIDER',
      } satisfies NormalizedLLMError;
    }

    const attempts: ProviderAttemptError[] = [];
    for (const provider of providers) {
      try {
        this.logger?.debug?.('llm:attempt', { provider: provider.name, task: run.task, modelHint: run.modelHint });
        const result = await provider.invoke(run, context);
        const normalized: NormalizedLLMSuccess = {
          ok: true,
          provider: provider.name,
          ...result,
        };
        cache?.set(key, normalized);
        return normalized;
      } catch (error) {
        const providerError = asProviderError(error);
        attempts.push({
          provider: provider.name,
          error: providerError.message,
          code: providerError.code,
          details: providerError.details,
        });
        this.logger?.warn?.('llm:provider-failed', {
          provider: provider.name,
          error: providerError.message,
          code: providerError.code,
        });
      }
    }

    return {
      ok: false,
      error: 'All LLM providers failed',
      code: 'ALL_PROVIDERS_FAILED',
      attempts,
    } satisfies NormalizedLLMError;
  }

  async fetchFeed<T = unknown>(request: FeedRequest, context: ProviderContext = {}): Promise<FeedResponse<T>> {
    const key = `feed:${stableStringify(request)}`;
    const cache = !request.disableCache ? this.feedCache : undefined;
    if (cache) {
      const cached = cache.get<NormalizedFeedSuccess<T>>(key);
      if (cached) {
        return { ...cached, cached: true } satisfies NormalizedFeedSuccess<T>;
      }
    }

    const providers = await this.feedPolicy.select(request, this.feedProviders);
    if (!providers.length) {
      return {
        ok: false,
        error: 'No feed provider available for request',
        code: 'NO_PROVIDER',
      } satisfies NormalizedFeedError;
    }

    const attempts: ProviderAttemptError[] = [];
    for (const provider of providers) {
      try {
        this.logger?.debug?.('feed:attempt', { provider: provider.name, fn: request.fn, symbol: request.symbol });
        const data = (await provider.fetch(request, context)) as T;
        const normalized: NormalizedFeedSuccess<T> = {
          ok: true,
          provider: provider.name,
          data,
          receivedAt: new Date().toISOString(),
        };
        cache?.set(key, normalized);
        return normalized;
      } catch (error) {
        const providerError = asProviderError(error);
        attempts.push({
          provider: provider.name,
          error: providerError.message,
          code: providerError.code,
          details: providerError.details,
        });
        this.logger?.warn?.('feed:provider-failed', {
          provider: provider.name,
          error: providerError.message,
          code: providerError.code,
        });
      }
    }

    return {
      ok: false,
      error: 'All feed providers failed',
      code: 'ALL_PROVIDERS_FAILED',
      attempts,
    } satisfies NormalizedFeedError;
  }

  private serializeOptions(): ApiManagerOptions {
    return {
      cache: this.cache,
      logger: this.logger,
      llm: {
        providers: this.llmProviders,
        policy: this.llmPolicy,
        cache: this.llmCache,
      },
      feeds: {
        providers: this.feedProviders,
        policy: this.feedPolicy,
        cache: this.feedCache,
      },
    } satisfies ApiManagerOptions;
  }
}
