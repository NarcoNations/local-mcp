export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { validateApiKey } from '@/examples/next-adapter/lib/security/apiKeys';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { createClient } from '@supabase/supabase-js';

function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  if (!flagEnabled('jobsWorker')) {
    return new Response('Jobs worker disabled', { status: 503 });
  }
  const auth = await validateApiKey(req.headers, 'admin:*', 'jobs.dispatch', 'jobs');
  if (!auth.ok) {
    return new Response(auth.reason ?? 'unauthorized', { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.kind !== 'string') {
    return new Response('Missing job kind', { status: 400 });
  }
  const payload = body.payload ?? {};

  const sb = supabaseServer();
  if (!sb) {
    return new Response('Supabase not configured', { status: 500 });
  }

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('jobs')
    .insert({
      kind: body.kind,
      payload,
      status: 'queued',
      attempts: 0,
      queued_at: now,
      created_at: now,
    })
    .select('*')
    .maybeSingle();
  if (error) {
    await logEvent({ source: 'jobs', kind: 'jobs.queue.error', title: 'Failed to enqueue job', body: error.message });
    return new Response('Unable to enqueue job', { status: 500 });
  }

  await logEvent({
    source: 'jobs',
    kind: `jobs.${body.kind}.queued`,
    title: `Queued ${body.kind}`,
    meta: { jobId: data?.id }
  });

  return Response.json({ ok: true, job: data });
}
