import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runLLM } from '@vibelabz/api-manager';
import { corsHeaders, applyCors } from '@/lib/http/cors';
import { checkRateLimit } from '@/lib/http/rate-limit';
import { logEvent } from '@/lib/historian';

export const runtime = 'nodejs';

const bodySchema = z.object({
  task: z.string(),
  prompt: z.string().min(4),
  modelHint: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  const rate = checkRateLimit(request);
  if (!rate.allowed) {
    return applyCors(new Response(JSON.stringify({ error: 'rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } }), cors);
  }

  try {
    const json = await request.json();
    const payload = bodySchema.parse(json);
    const startedAt = Date.now();
    const result = await runLLM(payload);
    await logEvent({
      source: 'api-manager',
      kind: 'api.llm',
      title: `${payload.task} via ${result.model}`,
      meta: {
        latency_ms: result.latencyMs,
        cost_estimate: result.costEstimate,
        ok: result.ok,
        prompt_hash: result.promptHash,
        attempted: result.policy.attempted,
        started_at: startedAt
      }
    });
    return applyCors(Response.json(result), cors);
  } catch (err: any) {
    await logEvent({
      source: 'api-manager',
      kind: 'error',
      title: 'LLM run failed',
      meta: { message: err?.message }
    });
    return applyCors(new Response(JSON.stringify({ error: err?.message || 'Invalid payload' }), { status: err?.status || 400, headers: { 'Content-Type': 'application/json' } }), cors);
  }
}

export function OPTIONS(request: NextRequest) {
  return applyCors(new Response(null, { status: 204 }), corsHeaders(request));
}
