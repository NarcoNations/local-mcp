import { sbServer } from './supabase/server';

type HistorianEvent = {
  source: string;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  meta?: any;
  severity?: 'debug' | 'info' | 'warn' | 'error';
  session_id?: string | null;
};

export async function logEvent(e: HistorianEvent) {
  try {
    const sb = sbServer();
    await sb.from('events').insert({
      ts: new Date().toISOString(),
      source: e.source,
      kind: e.kind,
      title: e.title,
      body: e.body ?? null,
      link: e.link ?? null,
      meta: e.meta ?? {},
      severity: e.severity ?? 'info',
      session_id: e.session_id ?? null
    });
  } catch (_) {
    // no-op; logging must not crash requests
  }
}
