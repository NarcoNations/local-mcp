import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export async function logEvent(e: { source: string; kind: string; title: string; body?: string; link?: string; meta?: any }) {
  try {
    const sb = sbServer();
    await sb.from('events').insert({
      ts: new Date().toISOString(),
      source: e.source,
      kind: e.kind,
      title: e.title,
      body: e.body ?? null,
      link: e.link ?? null,
      meta: e.meta ?? {}
    });
  } catch (_) {
    // no-op; logging must not crash requests
  }
}
