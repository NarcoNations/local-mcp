#!/usr/bin/env ts-node
import 'dotenv/config';
import { featureFlags } from '@/examples/next-adapter/lib/env';
import { takeNextJob, markJobDone, markJobError } from '@/examples/next-adapter/lib/jobs/store';
import { resolveHandler } from '@/examples/next-adapter/lib/jobs/handlers';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const POLL_INTERVAL = Number(process.env.JOB_POLL_INTERVAL_MS || 5000);

async function processOnce() {
  const job = await takeNextJob();
  if (!job) return false;
  const started = Date.now();
  try {
    await logEvent({
      source: 'jobs.worker',
      kind: 'job.start',
      title: `Processing ${job.kind}`,
      meta: { jobId: job.id },
    });
    const handler = resolveHandler(job.kind);
    await handler(job);
    await markJobDone(job.id, { duration_ms: Date.now() - started });
    await logEvent({
      source: 'jobs.worker',
      kind: 'job.done',
      title: `Finished ${job.kind}`,
      meta: { jobId: job.id, duration_ms: Date.now() - started },
    });
  } catch (err: any) {
    await markJobError(job.id, err);
    await logEvent({
      source: 'jobs.worker',
      kind: 'job.error',
      title: `Job ${job.kind} failed`,
      body: err?.message,
      meta: { jobId: job.id },
    });
  }
  return true;
}

async function loop() {
  if (!featureFlags.jobsWorker) {
    console.log('Jobs worker disabled via FF_JOBS_WORKER');
    return;
  }
  while (true) {
    const processed = await processOnce();
    if (!processed) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

if (require.main === module) {
  loop().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { loop as startJobsWorker };
