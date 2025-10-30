import { NextResponse } from 'next/server';
import { mockResearchResult } from '../../../src/mocks/research';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ query: mockResearchResult.query }));
  return NextResponse.json({ ...mockResearchResult, query: body.query ?? mockResearchResult.query });
}
