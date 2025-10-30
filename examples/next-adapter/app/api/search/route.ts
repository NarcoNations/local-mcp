import { NextResponse } from 'next/server';
import { mockSearchResults } from '../../../src/mocks/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').toLowerCase();
  if (!q) {
    return NextResponse.json([]);
  }
  const filtered = mockSearchResults.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.snippet.toLowerCase().includes(q) ||
    item.source.toLowerCase().includes(q),
  );
  return NextResponse.json(filtered);
}
