import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CacheClient } from '../types.js';

export interface SupabaseCacheOptions {
  table?: string;
  schema?: string;
}

const DEFAULT_TABLE = 'api_cache';

export class SupabaseCache implements CacheClient {
  private readonly client: SupabaseClient;
  private readonly table: string;

  constructor(url: string, key: string, options: SupabaseCacheOptions = {}) {
    this.client = createClient(url, key, { auth: { persistSession: false } });
    this.table = options.table ?? DEFAULT_TABLE;
  }

  async get<T>(key: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('payload, expires_at')
      .eq('key', key)
      .maybeSingle();
    if (error) {
      return null;
    }
    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      await this.client.from(this.table).delete().eq('key', key);
      return null;
    }
    return (data.payload as T) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const payload = value as unknown;
    await this.client
      .from(this.table)
      .upsert({
        key,
        payload,
        expires_at: expiresAt,
        provider: value && typeof value === 'object' ? (value as any).provider ?? null : null,
        ts: new Date().toISOString(),
      });
  }
}

