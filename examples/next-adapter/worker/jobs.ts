import { sbServer } from '../lib/supabase/server';
import { featureFlags } from '../lib/flags';
import { logEvent } from '../lib/historian';

export type JobRow = {
  id: string;
  kind: string;
  payload?: any;
  status: 'queued' | 'running' | 'done' | 'error';
  queued_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  result?: any;
  attempts?: number;
};

type JobHandler = (job: JobRow) => Promise<any>;

const handlers: Record<string, JobHandler> = {
  async convert(job) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { message: 'Conversion complete', input: job.payload };
  },
  async embed(job) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { message: 'Embedding complete', vectorSize: 1536 };
  },
  async 'search-index'(job) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    return { message: 'Search index updated', items: job.payload?.count ?? 0 };
  },
  async 'social:render'(job) {
    await new Promise((resolve) => setTimeout(resolve, 320));
    return { message: 'Rendered social assets', assets: job.payload?.assets ?? [] };
  },
  async 'map:build'(job) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { message: 'Map tiles built', layer: job.payload?.layerId };
  },
  async 'publish:site'(job) {
    await new Promise((resolve) => setTimeout(resolve, 220));
    return { message: 'Site publish package staged', site: job.payload?.site };
  },
};

async function pollNextJob() {
  const sb = sbServer();
  const { data, error } = await sb
    .from('jobs')
    .select()
    .eq('status', 'queued')
    .order('queued_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] as JobRow | undefined;
}

async function markJobRunning(job: JobRow) {
  const sb = sbServer();
  const { error } = await sb
    .from('jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    })
    .eq('id', job.id)
    .eq('status', 'queued');
  if (error) throw error;
}

async function finalizeJob(job: JobRow, status: 'done' | 'error', result: any) {
  const sb = sbServer();
  const finishedAt = new Date().toISOString();
  const duration = job.started_at ? Date.now() - new Date(job.started_at).getTime() : null;
  await sb
    .from('jobs')
    .update({
      status,
      finished_at: finishedAt,
      duration_ms: duration,
      result,
    })
    .eq('id', job.id);
  await logEvent({
    source: 'jobs',
    kind: `job.${status}`,
    title: `${job.kind} → ${status}`,
    meta: { id: job.id, result },
  });
}

async function processJob(job: JobRow) {
  await markJobRunning(job);
  await logEvent({
    source: 'jobs',
    kind: 'job.running',
    title: `${job.kind} started`,
    meta: { id: job.id },
  });
  const handler = handlers[job.kind];
  if (!handler) {
    await finalizeJob(job, 'error', { error: `No handler for ${job.kind}` });
    return;
  }
  try {
    const result = await handler(job);
    await finalizeJob(job, 'done', result);
  } catch (error: any) {
    await finalizeJob(job, 'error', { error: error?.message ?? 'Unknown error' });
  }
}

export async function runWorker({ intervalMs = 2000 } = {}) {
  if (!featureFlags.jobsWorker()) {
    console.log('FF_JOBS_WORKER disabled; worker will not start.');
    return;
  }
  console.log('Jobs worker started.');
  while (true) {
    try {
      const job = await pollNextJob();
      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }
      await processJob(job);
    } catch (error) {
      console.error('Job worker loop error', error);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

if (require.main === module) {
  runWorker().catch((error) => {
    console.error('Worker crashed', error);
    process.exit(1);
  });
}
