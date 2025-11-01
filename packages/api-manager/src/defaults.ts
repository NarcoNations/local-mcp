import { ApiManager } from './manager.js';
import { ApiManagerOptions, FeedProvider, LLMProvider } from './types.js';
import {
  createAlphaVantageFeedProvider,
  AlphaVantageProviderOptions,
} from './providers/feeds/alphaVantage.js';
import { createOpenAIProvider, OpenAIProviderOptions } from './providers/llm/openAI.js';
import { createLocalLLMProvider, LocalLLMProviderOptions } from './providers/llm/localEcho.js';

export interface DefaultProvidersConfig {
  llm?: {
    openAI?: OpenAIProviderOptions | false;
    localEcho?: LocalLLMProviderOptions | false;
  };
  feeds?: {
    alphaVantage?: AlphaVantageProviderOptions | false;
  };
}

export interface DefaultApiManagerOptions extends ApiManagerOptions {
  defaults?: DefaultProvidersConfig;
}

export function createDefaultApiManager(options: DefaultApiManagerOptions = {}): ApiManager {
  const defaults = options.defaults ?? {};
  const llmProviders: LLMProvider[] = [...(options.llm?.providers ?? [])];
  const feedProviders: FeedProvider[] = [...(options.feeds?.providers ?? [])];

  if (defaults.llm?.localEcho !== false) {
    llmProviders.push(createLocalLLMProvider(defaults.llm?.localEcho ?? {}));
  }
  if (defaults.llm?.openAI !== false) {
    llmProviders.push(createOpenAIProvider(defaults.llm?.openAI ?? {}));
  }
  if (defaults.feeds?.alphaVantage !== false) {
    feedProviders.push(createAlphaVantageFeedProvider(defaults.feeds?.alphaVantage ?? {}));
  }

  const baseOptions: ApiManagerOptions = {
    cache: options.cache,
    logger: options.logger,
    llm: {
      ...options.llm,
      providers: llmProviders,
    },
    feeds: {
      ...options.feeds,
      providers: feedProviders,
    },
  };

  return new ApiManager(baseOptions);
}
