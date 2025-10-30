import { NextResponse } from 'next/server';
import { mockWorkroomLanes } from '../../../src/mocks/workroom';

export async function GET() {
  return NextResponse.json(mockWorkroomLanes);
}
