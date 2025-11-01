import type { NextRequest } from 'next/server';

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();
const DEFAULT_LIMIT = Number(process.env.API_RATE_LIMIT || '60');
const WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS || '60000');

export function checkRateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || 'anonymous';
  const now = Date.now();
  const bucket = buckets.get(ip) || { tokens: DEFAULT_LIMIT, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  const restore = Math.floor(elapsed / WINDOW_MS) * DEFAULT_LIMIT;
  bucket.tokens = Math.min(DEFAULT_LIMIT, bucket.tokens + restore);
  bucket.updatedAt = now;
  if (bucket.tokens <= 0) {
    buckets.set(ip, bucket);
    return { allowed: false, retryAfter: WINDOW_MS / 1000 };
  }
  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return { allowed: true };
}
