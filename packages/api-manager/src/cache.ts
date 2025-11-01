import { CacheAdapter, CacheConfig } from './types.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(config: CacheConfig = {}) {
    this.ttlMs = config.ttlMs ?? 60_000;
    this.maxEntries = config.maxEntries ?? 500;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== Infinity && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt =
      ttlMs === 0
        ? Infinity
        : Date.now() + (ttlMs ?? this.ttlMs);
    if (!Number.isFinite(expiresAt)) {
      this.store.set(key, { value, expiresAt: Infinity });
    } else {
      this.store.set(key, { value, expiresAt });
    }
    this.evictIfNeeded();
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.maxEntries) return;
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const overflow = this.store.size - this.maxEntries;
    for (let i = 0; i < overflow; i += 1) {
      const key = entries[i]?.[0];
      if (key) this.store.delete(key);
    }
  }
}

export function ensureCacheAdapter(cache?: CacheAdapter | CacheConfig | false): CacheAdapter | undefined {
  if (cache === false) return undefined;
  if (!cache) return new MemoryCache();
  if (isCacheAdapter(cache)) return cache;
  return new MemoryCache(cache);
}

function isCacheAdapter(value: unknown): value is CacheAdapter {
  if (!value || typeof value !== 'object') return false;
  return (
    typeof (value as CacheAdapter).get === 'function' &&
    typeof (value as CacheAdapter).set === 'function' &&
    typeof (value as CacheAdapter).delete === 'function'
  );
}
