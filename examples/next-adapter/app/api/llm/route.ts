import { NextRequest } from 'next/server';

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.MCP_HTTP_URL;
  if (!baseUrl) {
    return errorResponse('MCP_HTTP_URL not configured on server');
  }

  const payload = await req.json();
  try {
    const res = await fetch(new URL('/api/llm', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' }
    });
  } catch (error: any) {
    return errorResponse(error?.message || 'Bridge request failed');
  }
}
