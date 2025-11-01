import { ProviderError } from '../types.js';

export interface FetchWithRetryOptions {
  fetcher?: typeof fetch;
  retries?: number;
  retryDelayMs?: number;
}

export async function fetchWithRetry(input: string | URL, init: RequestInit | undefined, options: FetchWithRetryOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const retries = options.retries ?? 2;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      const response = await fetcher(input, init);
      if (response.status === 429 || response.status >= 500) {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
        if (attempt < retries) {
          const delay = retryAfterMs ?? options.retryDelayMs ?? Math.pow(2, attempt) * 250;
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt += 1;
          continue;
        }
        throw new ProviderError('Rate limited or service unavailable', {
          status: response.status,
          retryAfterMs,
        });
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 250));
      attempt += 1;
    }
  }
  if (lastError instanceof ProviderError) {
    throw lastError;
  }
  throw new ProviderError('Provider request failed', {
    status: lastError && typeof lastError === 'object' && 'status' in lastError ? (lastError as any).status : undefined,
  });
}

