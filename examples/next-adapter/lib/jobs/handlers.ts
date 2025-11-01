import { logEvent } from '@/lib/historian';
import { rememberHash, wasProcessed, convertWithMd, writeToSupabase, makeSlug } from '@/lib/ingest/convert';
import { getJob, updateJob } from './store';

export async function runConvertJob(jobId: string) {
  const job = getJob(jobId);
  if (!job) throw new Error('job not found');
  await updateJob(jobId, { status: 'running', startedAt: new Date().toISOString() });
  try {
    const payload = job.payload as { fileName: string; fileType: string; buffer: string };
    const file = new File([Buffer.from(payload.buffer, 'base64')], payload.fileName, { type: payload.fileType });
    const result = await convertWithMd(file);
    if (wasProcessed(result.sha256)) {
      await updateJob(jobId, {
        status: 'completed',
        finishedAt: new Date().toISOString(),
        result: { skipped: true, reason: 'duplicate-content', hash: result.sha256 }
      });
      return;
    }
    rememberHash(result.sha256);
    const slug = makeSlug(file.name);
    let storage = null;
    if ((process.env.INGEST_SUPABASE || '').toLowerCase() === 'true') {
      storage = await writeToSupabase(slug, result.zipBytes, result.files);
    }
    await updateJob(jobId, {
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: {
        slug,
        files: result.files,
        storage,
        hash: result.sha256
      }
    });
    await logEvent({
      source: 'ingest',
      kind: 'ingest.convert',
      title: `Converted ${file.name}`,
      meta: { slug, count: result.files.length, hash: result.sha256 }
    });
  } catch (err: any) {
    await updateJob(jobId, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: err?.message || 'convert failed'
    });
    await logEvent({ source: 'ingest', kind: 'error', title: 'convert failed', meta: { jobId, message: err?.message } });
    throw err;
  }
}
