import { NextResponse } from 'next/server';
import { mockApiResults } from '../../../../src/mocks/apiManager';

export async function GET() {
  return NextResponse.json(mockApiResults);
}
