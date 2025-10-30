import { NextResponse } from 'next/server';
import { runEval } from '@/examples/next-adapter/lib/evals/engine';
import { requireScope } from '@/examples/next-adapter/lib/security/apiKeys';

export async function POST(request: Request) {
  const scopeCheck = await requireScope(request as any, 'llm:*');
  if ('status' in scopeCheck) {
    return NextResponse.json(scopeCheck.body, { status: scopeCheck.status });
  }

  const body = await request.json().catch(() => null);
  const models: string[] = body?.models ?? [];
  const datasetId: string = body?.datasetId;
  if (!datasetId || !Array.isArray(models) || models.length === 0) {
    return NextResponse.json({ error: 'datasetId and models[] required' }, { status: 400 });
  }

  try {
    const result = await runEval({ datasetId, models });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Eval failed' }, { status: 500 });
  }
}
