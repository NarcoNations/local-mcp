export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { runLLM } from '@/packages/api-manager/src';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = typeof body.task === 'string' ? body.task : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const modelHint = typeof body.modelHint === 'string' ? body.modelHint : undefined;
    if (!task || !prompt.trim()) {
      return new Response('task and prompt required', { status: 400 });
    }
    const started = Date.now();
    const result = await runLLM({ task, prompt, modelHint });
    const duration = Date.now() - started;
    if ((result as any)?.error) {
      await logEvent({
        source: 'api',
        kind: 'error',
        title: 'LLM router error',
        meta: { task, modelHint, duration, error: (result as any).error }
      });
      return Response.json({ ok: false, error: (result as any).error, status: (result as any).status ?? 500 }, {
        status: (result as any).status ?? 500
      });
    }
    await logEvent({
      source: 'api',
      kind: 'api.llm',
      title: `${task} via ${result.model || 'unknown'}`,
      meta: { task, modelHint, duration }
    });
    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    const message = err?.message || 'llm request failed';
    await logEvent({
      source: 'api',
      kind: 'error',
      title: 'LLM router exception',
      meta: { error: message }
    });
    return new Response(message, { status: 500 });
  }
}
