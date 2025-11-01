import { CacheAdapter } from "./types";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
}

export interface MemoryCacheOptions {
  maxEntries?: number;
}

export function createMemoryCache<T>(options?: MemoryCacheOptions): CacheAdapter<T> {
  const store = new Map<string, CacheEntry<T>>();
  const max = options?.maxEntries ?? 200;

  function pruneExpired(key: string, entry: CacheEntry<T>): boolean {
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      store.delete(key);
      return true;
    }
    return false;
  }

  function trimIfNeeded() {
    if (store.size <= max) return;
    const entries = Array.from(store.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
    while (entries.length && store.size > max) {
      const [key] = entries.shift()!;
      store.delete(key);
    }
  }

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (pruneExpired(key, entry)) return undefined;
      return entry.value;
    },
    set(key, value, ttlSeconds) {
      const expiresAt = typeof ttlSeconds === "number" && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
      store.set(key, { value, expiresAt, createdAt: Date.now() });
      trimIfNeeded();
    },
    delete(key) {
      store.delete(key);
    },
  };
}

export function createCacheKey(parts: Array<string | number | boolean | null | undefined>): string {
  return parts
    .map((part) => {
      if (part === undefined) return "u";
      if (part === null) return "n";
      if (typeof part === "boolean") return part ? "1" : "0";
      return String(part);
    })
    .join("::");
}
