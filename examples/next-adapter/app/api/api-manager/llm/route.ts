import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    id: `probe-${Date.now()}`,
    type: 'llm',
    request: body,
    response: 'LLM probe queued.',
    createdAt: new Date().toISOString(),
  });
}
