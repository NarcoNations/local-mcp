import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type AuditEntry = {
  actor: string;
  action: string;
  resource?: string;
  meta?: Record<string, any>;
};

export async function recordAudit(entry: AuditEntry) {
  try {
    const sb = sbServer();
    await sb.from('audit').insert({
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource ?? null,
      meta: entry.meta ?? {},
    });
    await logEvent({
      source: 'audit',
      kind: 'audit.event',
      title: `${entry.actor} → ${entry.action}`,
      meta: entry.meta ?? {},
    });
  } catch (err) {
    console.error('[audit] failed to record audit entry', err);
  }
}
