import { NextResponse } from 'next/server';
import { runLLM } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const task = typeof body?.task === 'string' ? body.task : 'System smoke test';
    const prompt = typeof body?.prompt === 'string' ? body.prompt : 'Ping the MCP Supabase bridge.';
    const result = await runLLM({ task, prompt, modelHint: 'openai' });
    return NextResponse.json(result, { status: result?.error ? 502 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
