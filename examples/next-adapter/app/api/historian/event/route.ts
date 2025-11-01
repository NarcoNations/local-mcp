export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sbServer } from '../../../../lib/supabase/server';

const HistorianEventBody = z.object({
  source: z.string().min(1),
  kind: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  link: z.string().url().optional(),
  severity: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  session_id: z.string().min(1).optional(),
  meta: z.record(z.any()).optional(),
  ts: z.string().datetime().optional()
});

function tokenOk(req: NextRequest) {
  const token = process.env.HISTORIAN_EVENT_TOKEN;
  if (!token) return true;
  const auth = req.headers.get('authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return Boolean(match && match[1] === token);
}

export async function POST(req: NextRequest) {
  if (!tokenOk(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = HistorianEventBody.safeParse(body);
  } catch (err: any) {
    return new Response('Invalid JSON: ' + (err?.message || 'unknown'), { status: 400 });
  }

  if (!parsed.success) {
    return new Response('Invalid payload: ' + parsed.error.message, { status: 400 });
  }

  const supabase = sbServer();
  const payload = parsed.data;

  const row = {
    ts: payload.ts ?? new Date().toISOString(),
    source: payload.source,
    kind: payload.kind,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
    meta: payload.meta ?? {},
    session_id: payload.session_id ?? null,
    severity: payload.severity,
  };

  const { error } = await supabase.from('events').insert(row);
  if (error) {
    return new Response('DB error: ' + error.message, { status: 500 });
  }

  return Response.json({ ok: true });
}
