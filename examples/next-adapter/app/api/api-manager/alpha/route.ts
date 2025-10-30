import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    id: `probe-${Date.now()}`,
    type: 'alpha',
    request: body,
    response: 'Alpha probe accepted.',
    createdAt: new Date().toISOString(),
  });
}
