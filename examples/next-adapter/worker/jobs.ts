import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export type JobRecord = {
  id: string;
  kind: string;
  payload: any;
  status: 'queued' | 'running' | 'done' | 'error';
  attempts: number;
  queued_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
};

type JobContext = {
  supabase: SupabaseClient | null;
};

type JobHandler = (job: JobRecord, ctx: JobContext) => Promise<void>;

const noop: JobHandler = async (job) => {
  await logEvent({
    source: 'jobs',
    kind: 'jobs.debug',
    title: `Stub handler invoked`,
    meta: { job }
  });
};

const jobHandlers: Record<string, JobHandler> = {
  convert: noop,
  embed: noop,
  'search-index': noop,
  'social:render': noop,
  'map:build': noop,
  'publish:site': noop,
};

export type JobWorkerOptions = {
  pollIntervalMs?: number;
};

function makeSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchNextJob(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .order('queued_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] as JobRecord | undefined;
}

async function markJob(
  sb: SupabaseClient,
  job: JobRecord,
  patch: Partial<Pick<JobRecord, 'status' | 'started_at' | 'finished_at' | 'error'>> & {
    duration_ms?: number;
  }
) {
  const { error } = await sb
    .from('jobs')
    .update({
      ...patch,
      attempts: job.attempts + (patch.status === 'running' ? 0 : 1),
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);
  if (error) throw error;
}

async function withHistorian(kind: string, cb: () => Promise<void>, meta: Record<string, any>) {
  const start = Date.now();
  await logEvent({ source: 'jobs', kind: `${kind}.start`, title: kind, meta });
  try {
    await cb();
    await logEvent({
      source: 'jobs',
      kind: `${kind}.finish`,
      title: kind,
      meta: { ...meta, duration_ms: Date.now() - start }
    });
  } catch (error: any) {
    await logEvent({
      source: 'jobs',
      kind: `${kind}.error`,
      title: kind,
      body: error?.message,
      meta: { ...meta, duration_ms: Date.now() - start }
    });
    throw error;
  }
}

export async function pollOnce({ pollIntervalMs = 5000 }: JobWorkerOptions = {}) {
  if (!flagEnabled('jobsWorker')) {
    return { status: 'disabled' } as const;
  }
  const supabase = makeSupabase();
  if (!supabase) {
    return { status: 'no-supabase' } as const;
  }
  const job = await fetchNextJob(supabase);
  if (!job) {
    return { status: 'idle', nextPollIn: pollIntervalMs } as const;
  }

  const handler = jobHandlers[job.kind] ?? noop;
  const startedAt = new Date().toISOString();
  await markJob(supabase, job, { status: 'running', started_at: startedAt });
  const ctx: JobContext = { supabase };
  try {
    await withHistorian(`jobs.${job.kind}`, () => handler(job, ctx), { jobId: job.id });
    await markJob(supabase, job, {
      status: 'done',
      finished_at: new Date().toISOString(),
    });
    return { status: 'processed', jobId: job.id } as const;
  } catch (error: any) {
    await markJob(supabase, job, {
      status: 'error',
      finished_at: new Date().toISOString(),
      error: error?.message || 'unknown',
    });
    return { status: 'error', jobId: job.id, message: error?.message } as const;
  }
}

export async function startWorker(options: JobWorkerOptions = {}) {
  const interval = options.pollIntervalMs ?? 5000;
  async function loop() {
    try {
      const result = await pollOnce(options);
      if (result.status === 'idle') {
        setTimeout(loop, result.nextPollIn ?? interval);
        return;
      }
    } catch (error: any) {
      await logEvent({ source: 'jobs', kind: 'jobs.loop-error', title: 'worker loop error', body: error?.message });
    }
    setTimeout(loop, interval);
  }
  if (!flagEnabled('jobsWorker')) {
    await logEvent({ source: 'jobs', kind: 'jobs.disabled', title: 'Job worker disabled by flag' });
    return () => {};
  }
  const timer = setTimeout(loop, interval);
  return () => clearTimeout(timer);
}

declare const require: any;
declare const module: any;

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  startWorker()
    .then(() => {
      console.log('[jobs] worker started');
    })
    .catch((error) => {
      console.error('[jobs] failed to start', error);
      process.exit(1);
    });
}
