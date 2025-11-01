import crypto from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { runLLM } from '@vibelabz/api-manager';
import { sbMaybe } from '@/examples/next-adapter/lib/supabase/maybeServer';
import { logEvent } from '@/examples/next-adapter/lib/historian';

const requestSchema = z.object({
  task: z.string(),
  prompt: z.string().min(1),
  modelHint: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const originCheck = enforceCors(req.headers.get('origin'));
  if (!originCheck.ok) {
    return NextResponse.json({ error: originCheck.error }, { status: originCheck.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.format() }, { status: 400 });
  }

  const { task, prompt, modelHint, metadata } = parsed.data;
  const started = Date.now();
  const result = await runLLM({ task: task as any, prompt, modelHint, metadata });
  const latencyMs = Date.now() - started;

  const supabase = sbMaybe();
  if (supabase) {
    try {
      await supabase.from('prompt_runs').insert({
        task,
        model: result.model,
        prompt_hash: sha(prompt),
        prompt,
        metadata: metadata ?? {},
        cost_est: result.costEstimate,
        latency_ms: latencyMs,
        ok: result.ok,
        output_preview: result.output.slice(0, 400),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('[llm-run] failed to persist prompt run', error);
    }
  }

  await logEvent({
    source: 'api-manager',
    kind: 'api.llm',
    title: `${task} → ${result.model}`,
    meta: {
      latencyMs,
      cost: result.costEstimate,
      ok: result.ok,
      tokensEstimated: result.tokensEstimated,
      fallbackError: result.error,
    },
  });

  return NextResponse.json(
    {
      model: result.model,
      output: result.output,
      latencyMs,
      costEstimate: result.costEstimate,
      ok: result.ok,
      error: result.error,
    },
    { status: 200, headers: corsHeaders(originCheck.origin) }
  );
}

function sha(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function enforceCors(origin: string | null) {
  const allowlist = (process.env.API_ALLOW_ORIGINS || 'http://localhost:3000').split(',');
  if (!origin) return { ok: true, origin: allowlist[0] };
  if (allowlist.includes(origin)) {
    return { ok: true, origin };
  }
  return { ok: false, status: 403, error: 'Origin not allowed' } as const;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key',
  };
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders(process.env.API_ALLOW_ORIGINS?.split(',')[0] ?? '*') });
}
