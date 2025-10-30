import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { logAudit } from '@/examples/next-adapter/lib/security/audit';

export type ApiKeyRecord = {
  id: string;
  name: string;
  secret: string;
  scopes: string[];
  created_at?: string;
  last_used_at?: string | null;
};

export const SCOPE_SETS: Record<string, string[]> = {
  'feeds:*': ['feeds:*'],
  'llm:*': ['llm:*'],
  'ingest:*': ['ingest:*'],
  'publish:*': ['publish:*'],
  'social:*': ['social:*'],
  'map:*': ['map:*'],
  'admin:*': ['admin:*'],
};

function scopeMatches(requested: string, actual: string[]) {
  if (actual.includes('admin:*')) return true;
  const [domain, action] = requested.split(':');
  return actual.some((granted) => {
    if (granted === `${domain}:*`) return true;
    return granted === requested;
  });
}

async function fetchApiKey(secret: string): Promise<ApiKeyRecord | null> {
  try {
    const sb = sbServer();
    const { data, error } = await sb
      .from('api_keys')
      .select()
      .eq('secret', secret)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (!Array.isArray(data.scopes)) {
      data.scopes = [];
    }
    await sb
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    return data as ApiKeyRecord;
  } catch (_) {
    return null;
  }
}

function validateHmac(request: NextRequest, secret: string) {
  const signature = request.headers.get('x-signature');
  if (!signature) return true;
  // App Router already parsed body for json(); fall back to header check with timestamp
  const timestamp = request.headers.get('x-timestamp') || '';
  const payload = `${timestamp}:${request.url}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function requireScope(request: NextRequest, scope: string) {
  const key = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!key) {
    return { status: 401, body: { error: 'Missing API key' } } as const;
  }
  const record = await fetchApiKey(key);
  if (!record) {
    return { status: 403, body: { error: 'Invalid API key' } } as const;
  }
  if (!scopeMatches(scope, record.scopes || [])) {
    return { status: 403, body: { error: 'Insufficient scope', required: scope } } as const;
  }
  if (!validateHmac(request, record.secret)) {
    return { status: 401, body: { error: 'Signature mismatch' } } as const;
  }
  await logAudit({
    actor: `api_key:${record.id}`,
    action: 'api.access',
    resource: request.nextUrl.pathname,
    meta: { scope },
  });
  return { record } as const;
}
