import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { fetchFeed } from '@vibelabz/api-manager';
import { sbMaybe } from '@/examples/next-adapter/lib/supabase/maybeServer';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const querySchema = z.object({
  symbol: z.string().min(1),
  resource: z.enum(['quote', 'timeseries', 'company']).default('quote'),
  interval: z.string().optional(),
  range: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const originCheck = enforceCors(req.headers.get('origin'));
  if (!originCheck.ok) {
    return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
  }

  const parseResult = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parseResult.error.format() }, { status: 400 });
  }
  const { symbol, resource, interval, range } = parseResult.data;

  const supabase = sbMaybe();
  const started = Date.now();
  const response = await fetchFeed(
    {
      provider: params.provider as any,
      symbol,
      resource,
      interval,
      range,
    },
    { supabase }
  );

  await logEvent({
    source: 'api-manager',
    kind: 'api.feed',
    title: `${params.provider}:${resource}`,
    meta: {
      symbol,
      cached: response.cached,
      status: response.status,
      latencyMs: Date.now() - started,
    },
  });

  const status = response.status === 'ok' ? 200 : 502;
  return NextResponse.json(response, { status, headers: corsHeaders(originCheck.origin) });
}

function enforceCors(origin: string | null) {
  const allowlist = (process.env.API_ALLOW_ORIGINS || 'http://localhost:3000').split(',');
  if (!origin) return { ok: true, origin: allowlist[0] };
  if (allowlist.includes(origin)) {
    return { ok: true, origin };
  }
  return { ok: false, status: 403, error: 'Origin not allowed' } as const;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
  };
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders(process.env.API_ALLOW_ORIGINS?.split(',')[0] ?? '*') });
}
