import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { enqueueJob } from '@/examples/next-adapter/lib/jobs/store';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const JobSchema = z.object({
  kind: z.string().min(1),
  payload: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const principal = await requireScope(req, 'admin:*');
    const json = await req.json();
    const parsed = JobSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(parsed.error.message, { status: 400 });
    }
    const job = await enqueueJob(parsed.data.kind, parsed.data.payload ?? {});
    await logEvent({
      source: 'jobs.dispatch',
      kind: 'job.queued',
      title: `Queued ${job.kind}`,
      meta: { jobId: job.id, actor: principal.id },
    });
    return Response.json({ ok: true, job });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Failed to enqueue job', { status });
  }
}
