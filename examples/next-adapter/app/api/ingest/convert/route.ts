import { NextRequest } from 'next/server';
import { z } from 'zod';
import { corsHeaders, applyCors } from '@/lib/http/cors';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { createJob, getJob } from '@/lib/jobs/store';
import { runConvertJob } from '@/lib/jobs/handlers';

const ALLOWED_TYPES = ['text/plain', 'application/pdf', 'application/zip', 'text/markdown', 'application/msword'];

export const runtime = 'nodejs';

const querySchema = z.object({ inline: z.string().optional() });

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  const rate = checkRateLimit(request);
  if (!rate.allowed) {
    return applyCors(new Response(JSON.stringify({ error: 'rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } }), cors);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return applyCors(new Response(JSON.stringify({ error: 'Expected multipart/form-data with file' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), cors);
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return applyCors(new Response(JSON.stringify({ error: 'Missing file' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), cors);
  }

  const parsed = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const inline = String(parsed.inline || '').toLowerCase() === 'true';
  const fileType = file.type || inferMime(file.name);
  if (fileType && !ALLOWED_TYPES.includes(fileType)) {
    return applyCors(new Response(JSON.stringify({ error: `Unsupported file type: ${fileType}` }), { status: 415, headers: { 'Content-Type': 'application/json' } }), cors);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const job = await createJob('ingest.convert', {
    fileName: file.name,
    fileType: fileType || 'application/octet-stream',
    buffer: buffer.toString('base64')
  });

  if (inline) {
    try {
      await runConvertJob(job.id);
      return applyCors(Response.json({ jobId: job.id, job: getJob(job.id) }), cors);
    } catch (err: any) {
      return applyCors(new Response(JSON.stringify({ error: err?.message || 'conversion failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } }), cors);
    }
  }

  queueMicrotask(async () => {
    try {
      await runConvertJob(job.id);
    } catch (err) {
      console.error('convert job failed', err);
    }
  });

  return applyCors(Response.json({ jobId: job.id }), cors);
}

export async function GET(request: NextRequest) {
  const cors = corsHeaders(request);
  const id = request.nextUrl.searchParams.get('jobId');
  if (!id) {
    return applyCors(new Response(JSON.stringify({ error: 'jobId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } }), cors);
  }
  const job = getJob(id);
  if (!job) {
    return applyCors(new Response(JSON.stringify({ error: 'job not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } }), cors);
  }
  return applyCors(Response.json({ jobId: id, job }), cors);
}

export function OPTIONS(request: NextRequest) {
  return applyCors(new Response(null, { status: 204 }), corsHeaders(request));
}

function inferMime(name: string) {
  if (name.endsWith('.md')) return 'text/markdown';
  if (name.endsWith('.zip')) return 'application/zip';
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/msword';
  return 'application/octet-stream';
}
