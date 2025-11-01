import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'crypto';

const PUBLIC_ENDPOINTS = new Set(['/api/metrics.json', '/api/health']);

const SCOPE_RULES: { prefix: string; scope: string | null }[] = [
  { prefix: '/api/ingest', scope: 'ingest:*' },
  { prefix: '/api/jobs', scope: 'admin:*' },
  { prefix: '/api/evals', scope: 'llm:*' },
  { prefix: '/api/mvp', scope: 'publish:*' },
  { prefix: '/api/map', scope: 'map:*' },
  { prefix: '/api/social', scope: 'social:*' },
  { prefix: '/api/mcp', scope: 'publish:*' },
  { prefix: '/api/llm', scope: 'llm:*' },
  { prefix: '/api/search', scope: 'feeds:*' },
  { prefix: '/api/jobs/dispatch', scope: 'admin:*' },
];

function resolveScope(pathname: string) {
  for (const rule of SCOPE_RULES) {
    if (pathname.startsWith(rule.prefix)) {
      return rule.scope;
    }
  }
  return pathname.startsWith('/api/') ? 'admin:*' : null;
}

async function getApiKeyRecord(hashedKey: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('hashed_key', hashedKey)
    .maybeSingle();
  return data as { id: string; name: string; scopes: string[] } | null;
}

async function touchLastUsed(id: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id);
  await supabase.from('audit').insert({
    actor: `api_key:${id}`,
    action: 'api.request',
    resource: 'middleware',
    meta: { ts: new Date().toISOString() },
  });
}

function verifyHmac(request: NextRequest) {
  const provided = request.headers.get('x-api-hmac');
  if (!provided) return true;
  const secret = process.env.API_HMAC_SECRET;
  if (!secret) return true;
  const timestamp = request.headers.get('x-api-timestamp') || '';
  const payload = `${timestamp}:${request.method}:${request.nextUrl.pathname}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  return provided === expected;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_ENDPOINTS.has(pathname)) {
    return NextResponse.next();
  }
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const scope = resolveScope(pathname);
  if (!scope) {
    return NextResponse.next();
  }

  if (!verifyHmac(request)) {
    return new NextResponse('Invalid HMAC signature', { status: 401 });
  }

  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return new NextResponse('Missing API key', { status: 401 });
  }

  const hashed = createHash('sha256').update(apiKey).digest('hex');
  const record = await getApiKeyRecord(hashed);
  if (!record) {
    return new NextResponse('Invalid API key', { status: 401 });
  }

  const allowed = record.scopes?.some((s) => s === scope || s === 'admin:*');
  if (!allowed) {
    return new NextResponse('Insufficient scope', { status: 403 });
  }

  await touchLastUsed(record.id);
  const headers = new Headers(request.headers);
  headers.set('x-api-key-id', record.id);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/api/:path*'],
};
