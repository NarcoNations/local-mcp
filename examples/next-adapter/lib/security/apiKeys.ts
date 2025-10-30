import { createClient } from '@supabase/supabase-js';
import { recordAudit } from '@/examples/next-adapter/lib/security/audit';

const DEMO_KEY = 'demo-key';
const DEMO_SCOPES = ['*'];

export type ApiKeyRecord = {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
};

function supabaseService() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type ScopeCheckResult = {
  ok: boolean;
  reason?: string;
  apiKey?: ApiKeyRecord;
};

function hasScope(key: ApiKeyRecord, required: string) {
  if (!required) return true;
  if (key.scopes.includes('*')) return true;
  if (required.endsWith(':*')) {
    return key.scopes.some((scope) => scope === required || scope === '*');
  }
  return key.scopes.includes(required) || key.scopes.includes(required.split(':')[0] + ':*') || key.scopes.includes('*');
}

export async function validateApiKey(headers: Headers, requiredScope: string, action?: string, resource?: string): Promise<ScopeCheckResult> {
  const key = headers.get('x-api-key') || headers.get('authorization')?.replace('Bearer ', '');
  if (!key) {
    return { ok: false, reason: 'missing api key' };
  }
  if (process.env.USE_MOCKS === 'true' && key === DEMO_KEY) {
    const record = {
      ok: hasScope({ id: 'demo', name: 'Demo', scopes: DEMO_SCOPES, created_at: new Date().toISOString(), last_used_at: null }, requiredScope),
      apiKey: { id: 'demo', name: 'Demo', scopes: DEMO_SCOPES, created_at: new Date().toISOString(), last_used_at: null }
    };
    if (record.ok && action) {
      await recordAudit({
        ts: new Date().toISOString(),
        actor: 'demo-key',
        action,
        resource: resource ?? 'mock',
      });
    }
    return record;
  }
  const sb = supabaseService();
  if (!sb) {
    return { ok: false, reason: 'no supabase service key configured' };
  }
  const { data, error } = await sb.from('api_keys').select('*').eq('id', key).maybeSingle();
  if (error) {
    return { ok: false, reason: error.message };
  }
  if (!data) {
    return { ok: false, reason: 'invalid api key' };
  }
  const record = data as ApiKeyRecord;
  if (!hasScope(record, requiredScope)) {
    return { ok: false, reason: 'insufficient scope' };
  }
  await sb.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', record.id);
  if (action) {
    await recordAudit({
      ts: new Date().toISOString(),
      actor: record.id,
      action,
      resource: resource ?? 'api',
    });
  }
  return { ok: true, apiKey: record };
}

export function requireScope(headers: Headers, scope: string) {
  return validateApiKey(headers, scope);
}
