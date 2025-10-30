import { NextRequest } from 'next/server';
import { requireScope } from '@/examples/next-adapter/lib/security/apiAuth';
import { runEval } from '@/examples/next-adapter/lib/evals/run';

export async function POST(req: NextRequest) {
  try {
    await requireScope(req, 'llm:*');
    const body = await req.json();
    const dataset = body.dataset || 'baseline-qa';
    const models = Array.isArray(body.models) && body.models.length ? body.models : ['openai:gpt-4o', 'anthropic:claude-3-haiku'];
    const promptId = body.promptId || null;
    const result = await runEval(dataset, models, promptId ?? undefined);
    return Response.json({ ok: true, result });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(err?.message || 'Eval run failed', { status });
  }
}
