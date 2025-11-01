import { NextRequest } from 'next/server';

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.MCP_HTTP_URL;
  if (!baseUrl) {
    return errorResponse('MCP_HTTP_URL not configured on server');
  }

  const { searchParams } = new URL(req.url);
  const fn = searchParams.get('fn') ?? 'TIME_SERIES_DAILY';
  const symbol = searchParams.get('symbol') ?? 'SPY';
  const target = new URL('/api/feeds/alpha', baseUrl);
  target.searchParams.set('fn', fn);
  target.searchParams.set('symbol', symbol);

  try {
    const res = await fetch(target, { cache: 'no-store' });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' }
    });
  } catch (error: any) {
    return errorResponse(error?.message || 'Bridge request failed');
  }
}
