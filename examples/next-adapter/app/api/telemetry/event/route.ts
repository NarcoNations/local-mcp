export const runtime = 'nodejs';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const TelemetryBody = z.object({
  campaign_id: z.string().uuid().optional(),
  channel_key: z.string().min(1).optional(),
  event_type: z.enum(['impression','click','view','like','share','comment','signup','purchase']),
  occurred_at: z.string().datetime().optional(),
  value: z.number().optional(),
  meta: z.record(z.any()).optional(),
});

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  return createClient(url, key, { auth: { persistSession: false } });
}

function bearerOk(req: Request) {
  const token = process.env.TELEMETRY_BEARER_TOKEN;
  if (!token) return true;
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return Boolean(m && m[1] === token);
}

async function ensureChannelId(supabase: SupabaseClient, key?: string | null) {
  if (!key) return null;
  const { data: found } = await supabase.from('channels').select('id').eq('key', key).maybeSingle();
  if (found?.id) return found.id;
  const { data, error } = await supabase.from('channels').insert({ key, label: key }).select('id').maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function POST(req: Request) {
  try {
    if (!bearerOk(req)) return new Response('Unauthorized', { status: 401 });

    const json = await req.json();
    const parsed = TelemetryBody.safeParse(json);
    if (!parsed.success) {
      return new Response('Invalid payload: ' + parsed.error.message, { status: 400 });
    }
    const body = parsed.data;

    const supabase = getSupabaseAdmin();
    const channel_id = await ensureChannelId(supabase, body.channel_key);

    const row = {
      campaign_id: body.campaign_id ?? null,
      channel_id,
      occurred_at: body.occurred_at ?? new Date().toISOString(),
      event_type: body.event_type,
      value: body.value ?? null,
      meta: body.meta ?? {},
    };

    const { error } = await supabase.from('campaign_events').insert(row);
    if (error) return new Response('DB error: ' + error.message, { status: 500 });

    return Response.json({ ok: true });
  } catch (err: any) {
    return new Response('Error: ' + (err?.message || String(err)), { status: 500 });
  }
}
