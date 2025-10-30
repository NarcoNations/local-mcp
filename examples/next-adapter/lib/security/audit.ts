import { createClient } from '@supabase/supabase-js';
import { mockAuditLog } from '@/examples/next-adapter/lib/mocks/m3';

export type AuditRecord = {
  ts: string;
  actor: string;
  action: string;
  resource: string;
  meta?: Record<string, any>;
};

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function recordAudit(event: AuditRecord) {
  const sb = supabaseService();
  if (!sb) return;
  await sb.from('audit').insert({
    ts: event.ts,
    actor: event.actor,
    action: event.action,
    resource: event.resource,
    meta: event.meta ?? {},
  });
}

export async function listAudit(limit = 50): Promise<AuditRecord[]> {
  if (process.env.USE_MOCKS === 'true') return mockAuditLog;
  const sb = supabaseService();
  if (!sb) return [];
  const { data } = await sb.from('audit').select('*').order('ts', { ascending: false }).limit(limit);
  return (data ?? []) as AuditRecord[];
}
