import { CacheClient, CacheEntry } from '../types.js';

export interface MemoryCacheOptions {
  maxEntries?: number;
}

const DEFAULT_MAX = 200;

export class MemoryCache implements CacheClient {
  private store = new Map<string, CacheEntry<unknown>>();
  private order: string[] = [];

  constructor(private readonly options: MemoryCacheOptions = {}) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }
    this.touch(key);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.touch(key);
    this.enforceLimit();
  }

  private touch(key: string) {
    this.order = this.order.filter((k) => k !== key);
    this.order.push(key);
  }

  private delete(key: string) {
    this.store.delete(key);
    this.order = this.order.filter((k) => k !== key);
  }

  private enforceLimit() {
    const maxEntries = this.options.maxEntries ?? DEFAULT_MAX;
    while (this.order.length > maxEntries) {
      const oldest = this.order.shift();
      if (oldest) {
        this.store.delete(oldest);
      }
    }
  }
}

