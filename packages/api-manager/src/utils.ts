import type { FeedProvider } from './types';

export async function readSupabaseCache(
  supabase: { url: string; serviceKey: string } | null,
  provider: FeedProvider,
  key: string
) {
  if (!supabase) return null;
  try {
    const search = new URLSearchParams({ select: 'payload,ts,status', key: `eq.${key}`, provider: `eq.${provider}`, order: 'ts.desc', limit: '1' });
    const res = await fetch(`${supabase.url}/rest/v1/api_cache?${search.toString()}`, {
      headers: {
        apikey: supabase.serviceKey,
        Authorization: `Bearer ${supabase.serviceKey}`
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json) && json.length > 0) {
      const payload = json[0]?.payload;
      return typeof payload === 'string' ? JSON.parse(payload) : payload;
    }
    return null;
  } catch (err) {
    console.warn('supabase cache read failed', err);
    return null;
  }
}

export async function writeSupabaseCache(
  supabase: { url: string; serviceKey: string } | null,
  provider: FeedProvider,
  key: string,
  value: unknown,
  status: number
) {
  if (!supabase) return;
  try {
    await fetch(`${supabase.url}/rest/v1/api_cache`, {
      method: 'POST',
      headers: {
        apikey: supabase.serviceKey,
        Authorization: `Bearer ${supabase.serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, provider, payload: value, status, ts: new Date().toISOString() })
    });
  } catch (err) {
    console.warn('supabase cache write failed', err);
  }
}

export async function insertSupabase(
  supabase: { url: string; serviceKey: string } | null,
  table: string,
  values: Record<string, unknown>
) {
  if (!supabase) return;
  try {
    await fetch(`${supabase.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: supabase.serviceKey,
        Authorization: `Bearer ${supabase.serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(values)
    });
  } catch (err) {
    console.warn('supabase insert failed', err);
  }
}
