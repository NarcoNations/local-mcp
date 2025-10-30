export type CacheEntry<T> = { value: T; expiresAt: number };

export class LRUCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private readonly maxEntries = 150, private readonly ttlMs = 60_000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt });
    this.prune();
  }

  private prune() {
    if (this.store.size <= this.maxEntries) return;
    const extra = this.store.size - this.maxEntries;
    const keys = this.store.keys();
    for (let i = 0; i < extra; i += 1) {
      const next = keys.next();
      if (next.done) break;
      this.store.delete(next.value);
    }
  }
}
