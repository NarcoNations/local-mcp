import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logEvent } from '@/examples/next-adapter/lib/historian';

type AuditEntry = {
  actor: string;
  action: string;
  resource?: string | null;
  meta?: Record<string, any>;
};

export async function logAudit(entry: AuditEntry) {
  try {
    const sb = sbServer();
    await sb.from('audit').insert({
      ts: new Date().toISOString(),
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource ?? null,
      meta: entry.meta ?? {},
    });
  } catch (_) {
    // logging failures should never crash a request path
  }

  try {
    await logEvent({
      source: 'audit',
      kind: 'audit',
      title: `${entry.action}${entry.resource ? `: ${entry.resource}` : ''}`,
      meta: entry.meta ?? {},
    });
  } catch (_) {
    // historian failures ignored as well
  }
}
