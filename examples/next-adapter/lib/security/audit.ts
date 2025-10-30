import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';

export type AuditEvent = {
  actor: string | null;
  action: string;
  resource: string;
  meta?: Record<string, any>;
};

export async function writeAuditEvent(event: AuditEvent) {
  try {
    const supabase = sbAdmin();
    await supabase.from('audit').insert({
      ts: new Date().toISOString(),
      actor: event.actor,
      action: event.action,
      resource: event.resource,
      meta: event.meta ?? {},
    });
  } catch (_) {
    // swallow errors — audit must not break runtime
  }
}
