import { NextResponse } from 'next/server';
import { mockPrompts } from '../../../src/mocks/prompts';

export async function GET() {
  return NextResponse.json(mockPrompts);
}
