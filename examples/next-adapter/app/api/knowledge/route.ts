import { NextResponse } from 'next/server';
import { mockKnowledgeRecords } from '../../../src/mocks/knowledge';

export async function GET() {
  return NextResponse.json(mockKnowledgeRecords);
}
