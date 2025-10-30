import { NextRequest } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { runtimeFlags } from '@/examples/next-adapter/lib/env';
import { writeAuditEvent } from '@/examples/next-adapter/lib/security/audit';

export type ApiPrincipal = {
  id: string;
  name?: string | null;
  scopes: string[];
};

function parseAuthHeader(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1];
  return req.headers.get('x-api-key') || null;
}

function hasScope(scopes: string[] | null | undefined, requested: string) {
  if (!scopes?.length) return false;
  if (scopes.includes('admin:*')) return true;
  if (requested === 'admin:*') return scopes.includes('admin:*');
  if (scopes.includes('*') || scopes.includes(requested)) return true;
  const [domain] = requested.split(':');
  return scopes.includes(`${domain}:*`);
}

async function verifyHmac(req: NextRequest) {
  const secret = process.env.API_HMAC_SECRET;
  if (!secret) return true;
  const signature = req.headers.get('x-signature');
  if (!signature) return false;
  const raw = await req.clone().text();
  const digest = createHmac('sha256', secret).update(raw).digest('hex');
  return createHash('sha256').update(signature).digest('hex') === createHash('sha256').update(digest).digest('hex');
}

export async function requireScope(req: NextRequest, scope: string): Promise<ApiPrincipal> {
  if (runtimeFlags.useMocks) {
    return { id: 'mock', name: 'Mock Principal', scopes: ['*'] };
  }

  if (!(await verifyHmac(req))) {
    throw Object.assign(new Error('Invalid signature'), { status: 401 });
  }

  const key = parseAuthHeader(req);
  if (!key) {
    throw Object.assign(new Error('Missing API key'), { status: 401 });
  }

  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id,name,scopes')
    .eq('id', key)
    .maybeSingle();

  if (error) {
    throw Object.assign(new Error('API key lookup failed'), { status: 500 });
  }

  if (!data) {
    throw Object.assign(new Error('Invalid API key'), { status: 401 });
  }

  const scopes = Array.isArray(data.scopes) ? (data.scopes.filter(Boolean) as string[]) : [];
  if (!hasScope(scopes, scope)) {
    throw Object.assign(new Error('Insufficient scope'), { status: 403 });
  }

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  await writeAuditEvent({
    actor: data.id,
    action: 'api.access',
    resource: req.nextUrl.pathname,
    meta: { scope },
  });

  return { id: data.id, name: data.name, scopes };
}
