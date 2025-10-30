export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import { runLLM, type LLMRun } from '../../../../../../packages/api-manager/src';
import { logEvent } from '@/examples/next-adapter/lib/historian';

export async function POST(req: NextRequest) {
  let payload: LLMRun;
  try {
    const body = await req.json();
    if (!body?.task || !body?.prompt || !isValidTask(body.task)) {
      return new Response('task (draft_copy|summarize|classify) and prompt are required', { status: 400 });
    }
    payload = { task: body.task, prompt: body.prompt, modelHint: body.modelHint };
  } catch (e: any) {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const start = Date.now();
  try {
    const result = await runLLM(payload);
    if ((result as any)?.error) {
      throw new Error((result as any).error);
    }
    const duration = Date.now() - start;
    await logEvent({
      source: 'api-manager',
      kind: 'api.llm',
      title: `${payload.task} request`,
      meta: { task: payload.task, model: (result as any).model, duration_ms: duration }
    });
    return Response.json({ ok: true, result });
  } catch (e: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'LLM router failed',
      body: e?.message || 'unknown',
      meta: { task: payload.task }
    });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

function isValidTask(task: any): task is LLMRun['task'] {
  return task === 'draft_copy' || task === 'summarize' || task === 'classify';
}
