export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { runLLM } from '@vibelabz/api-manager';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const tasks = new Set(['draft_copy', 'summarize', 'classify']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = body?.task;
    const prompt = body?.prompt;
    const modelHint = body?.modelHint;
    if (!tasks.has(task)) {
      return new Response('task must be draft_copy, summarize, or classify', { status: 400 });
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response('prompt is required', { status: 400 });
    }
    const started = Date.now();
    const response = await runLLM({ task, prompt, modelHint });
    const durationMs = Date.now() - started;
    const isError = Boolean(response && typeof response === 'object' && 'error' in response && !response.output);

    await logEvent({
      source: 'api-manager',
      kind: 'api.llm',
      title: `LLM task ${task}`,
      meta: { task, modelHint: modelHint || null, durationMs, ok: !isError }
    });
    if (isError) {
      await logEvent({
        source: 'api-manager',
        kind: 'error',
        title: 'LLM route error',
        body: String((response as any).error || 'unknown'),
        meta: { task, modelHint: modelHint || null }
      });
    }

    return Response.json({ ok: !isError, response, durationMs });
  } catch (err: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'LLM route exception',
      body: err?.message || String(err)
    });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}
