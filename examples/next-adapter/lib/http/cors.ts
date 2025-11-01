import type { NextRequest } from 'next/server';

const DEFAULT_ALLOW = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function resolveAllowedOrigins() {
  const fromEnv = (process.env.CORS_ALLOWLIST || '').split(',').map((item) => item.trim()).filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOW;
}

export function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = resolveAllowedOrigins();
  const headers = new Headers();
  if (origin && allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function applyCors(response: Response, headers: Headers) {
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}
