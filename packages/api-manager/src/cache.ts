import crypto from 'crypto';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type CacheConfig = {
  ttlMs?: number;
  maxEntries?: number;
};

export class MemoryCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  private ttlMs: number;
  private maxEntries: number;

  constructor(config?: CacheConfig) {
    this.ttlMs = config?.ttlMs ?? 60_000;
    this.maxEntries = config?.maxEntries ?? 200;
  }

  get(key: string) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.map.size >= this.maxEntries) {
      const firstKey = this.map.keys().next().value as string | undefined;
      if (firstKey) this.map.delete(firstKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  static createKey(provider: string, payload: unknown) {
    return `${provider}:${crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')}`;
  }
}
