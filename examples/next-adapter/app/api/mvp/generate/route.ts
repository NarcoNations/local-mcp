import { NextResponse } from 'next/server';
import { mockMvpResult } from '../../../../src/mocks/mvp';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ brief: '' }));
  return NextResponse.json({ ...mockMvpResult, summary: `${mockMvpResult.summary} — Generated from brief length ${body.brief?.length ?? 0}.` });
}
