import { createClient } from '@supabase/supabase-js';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { featureFlags, isFlagEnabled } from '@/examples/next-adapter/lib/featureFlags';

// EDIT HERE: register new job kinds + concrete handler logic per deployment
const HANDLERS: Record<string, (job: JobRecord, ctx: HandlerContext) => Promise<void>> = {
  convert: async (job, ctx) => ctx.markDone(job.id, { note: 'Convert stub complete' }),
  embed: async (job, ctx) => ctx.markDone(job.id, { note: 'Embed stub complete' }),
  'search-index': async (job, ctx) => ctx.markDone(job.id, { note: 'Search index stub complete' }),
  'social:render': async (job, ctx) => ctx.markDone(job.id, { note: 'Social render placeholder' }),
  'map:build': async (job, ctx) => ctx.markDone(job.id, { note: 'Map build placeholder' }),
  'publish:site': async (job, ctx) => ctx.markDone(job.id, { note: 'Publish stub complete' }),
};

export type JobRecord = {
  id: string;
  kind: string;
  payload: Record<string, any> | null;
  status: string;
  attempts: number;
  max_attempts: number | null;
  scheduled_at: string | null;
};

export type HandlerContext = {
  supabase: ReturnType<typeof createClient>;
  log: typeof logEvent;
  markRunning: (id: string, attempts: number) => Promise<void>;
  markDone: (id: string, meta?: Record<string, any>) => Promise<void>;
  markError: (id: string, error: Error | string) => Promise<void>;
};

const POLL_INTERVAL_MS = Number(process.env.JOB_WORKER_POLL_MS || 5000);

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SERVICE_KEY required for worker');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchNextJob(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as JobRecord | null;
}

async function updateJob(
  supabase: ReturnType<typeof createClient>,
  id: string,
  patch: Record<string, any>,
) {
  const { error } = await supabase.from('jobs').update(patch).eq('id', id);
  if (error) throw error;
}

export async function runWorkerLoop() {
  if (!isFlagEnabled('FF_JOBS_WORKER')) {
    console.warn('[jobs] FF_JOBS_WORKER disabled — skipping worker loop');
    return;
  }
  const supabase = createSupabaseAdmin();
  const ctx: HandlerContext = {
    supabase,
    log: logEvent,
    markRunning: (id: string, attempts: number) =>
      updateJob(supabase, id, {
        status: 'running',
        attempts,
        started_at: new Date().toISOString(),
      }),
    markDone: async (id: string, meta?: Record<string, any>) => {
      await updateJob(supabase, id, {
        status: 'done',
        finished_at: new Date().toISOString(),
        duration_ms: null,
        error: null,
        meta: meta ?? {},
      });
    },
    markError: async (id: string, error: Error | string) => {
      await updateJob(supabase, id, {
        status: 'error',
        finished_at: new Date().toISOString(),
        error: typeof error === 'string' ? error : error.message,
      });
    },
  };

  while (featureFlags.FF_JOBS_WORKER) {
    try {
      const job = await fetchNextJob(supabase);
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      const handler = HANDLERS[job.kind];
      if (!handler) {
        await ctx.markError(job.id, `No handler for kind ${job.kind}`);
        await logEvent({
          source: 'jobs',
          kind: 'job.error',
          title: `Unknown job kind ${job.kind}`,
          body: JSON.stringify(job.payload ?? {}),
        });
        continue;
      }
      const attempts = (job.attempts ?? 0) + 1;
      await ctx.markRunning(job.id, attempts);
      const started = Date.now();
      try {
        await handler(job, ctx);
        const duration = Date.now() - started;
        await updateJob(supabase, job.id, { duration_ms: duration });
        await logEvent({
          source: 'jobs',
          kind: 'job.done',
          title: `${job.kind} #${job.id} finished`,
          meta: { duration, job },
        });
      } catch (err: any) {
        await ctx.markError(job.id, err);
        await logEvent({
          source: 'jobs',
          kind: 'job.error',
          title: `${job.kind} #${job.id} failed`,
          body: err?.message ?? String(err),
          meta: { job },
        });
      }
    } catch (err) {
      console.error('[jobs] worker loop error', err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

export async function once() {
  const supabase = createSupabaseAdmin();
  const job = await fetchNextJob(supabase);
  if (!job) return null;
  const ctx: HandlerContext = {
    supabase,
    log: logEvent,
    markRunning: (id: string, attempts: number) =>
      updateJob(supabase, id, {
        status: 'running',
        attempts,
        started_at: new Date().toISOString(),
      }),
    markDone: (id: string, meta?: Record<string, any>) =>
      updateJob(supabase, id, {
        status: 'done',
        finished_at: new Date().toISOString(),
        duration_ms: null,
        meta: meta ?? {},
      }),
    markError: (id: string, error: Error | string) =>
      updateJob(supabase, id, {
        status: 'error',
        finished_at: new Date().toISOString(),
        error: typeof error === 'string' ? error : error.message,
      }),
  };
  const handler = HANDLERS[job.kind];
  if (!handler) {
    await ctx.markError(job.id, `No handler for kind ${job.kind}`);
    return null;
  }
  const attempts = (job.attempts ?? 0) + 1;
  await ctx.markRunning(job.id, attempts);
  await handler(job, ctx);
  return job;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
