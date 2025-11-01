export function stableStringify(value: unknown): string {
  return JSON.stringify(value, replacer);
}

function replacer(_key: string, val: unknown): unknown {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return val;
  }
  return Object.keys(val)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (val as Record<string, unknown>)[key];
      return acc;
    }, {});
}

export class ProviderError extends Error {
  constructor(message: string, public readonly code?: string, public readonly details?: unknown) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function asProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;
  if (error instanceof Error) {
    return new ProviderError(error.message, (error as { code?: string }).code, error);
  }
  return new ProviderError(String(error));
}
