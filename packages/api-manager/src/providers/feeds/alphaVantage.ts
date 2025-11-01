import { ApiManager } from '../../manager.js';
import { createDefaultApiManager } from '../../defaults.js';
import { FeedProvider, FeedRequest, FeedResponse, ProviderContext } from '../../types.js';
import { ProviderError } from '../../utils.js';

export interface AlphaVantageProviderOptions {
  apiKey?: string;
  baseUrl?: string;
}

export function createAlphaVantageFeedProvider(
  options: AlphaVantageProviderOptions = {}
): FeedProvider {
  const baseUrl = options.baseUrl ?? 'https://www.alphavantage.co/query';
  return {
    name: 'alpha-vantage',
    supports() {
      const apiKey = options.apiKey ?? process.env.ALPHA_VANTAGE_KEY;
      return Boolean(apiKey);
    },
    priority() {
      return 10;
    },
    async fetch(request: FeedRequest, context: ProviderContext = {}) {
      const apiKey = options.apiKey ?? process.env.ALPHA_VANTAGE_KEY;
      if (!apiKey) {
        throw new ProviderError('ALPHA_VANTAGE_KEY not set', 'CONFIG_MISSING');
      }
      const url = new URL(baseUrl);
      url.searchParams.set('function', request.fn);
      url.searchParams.set('symbol', request.symbol);
      url.searchParams.set('apikey', apiKey);
      if (request.params) {
        for (const [key, value] of Object.entries(request.params)) {
          if (value === undefined || value === null) continue;
          url.searchParams.set(key, String(value));
        }
      }
      const response = await fetch(url, { signal: context.signal });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new ProviderError(`Alpha Vantage request failed (${response.status})`, 'HTTP_ERROR', {
          status: response.status,
          body: safeJsonParse(text),
        });
      }
      const data = await response.json();
      if (data['Error Message']) {
        throw new ProviderError(String(data['Error Message']), 'REMOTE_ERROR', data);
      }
      return data;
    },
  } satisfies FeedProvider;
}

function safeJsonParse(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let defaultManager: ApiManager | null = null;

function getManager(): ApiManager {
  if (!defaultManager) {
    defaultManager = createDefaultApiManager();
  }
  return defaultManager;
}

export async function fetchFeed<T = unknown>(
  request: FeedRequest,
  context?: ProviderContext
): Promise<FeedResponse<T>> {
  return getManager().fetchFeed<T>(request, context);
}
