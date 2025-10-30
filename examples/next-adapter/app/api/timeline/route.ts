import { NextResponse } from 'next/server';
import { mockTimelineEvents } from '../../../src/mocks/timeline';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const start = (page - 1) * 6;
  const end = start + 6;
  return NextResponse.json(mockTimelineEvents.slice(start, end));
}
