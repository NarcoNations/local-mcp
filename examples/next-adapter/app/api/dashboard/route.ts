import { NextResponse } from 'next/server';
import { mockDashboardData } from '../../../src/mocks/dashboard';

export async function GET() {
  return NextResponse.json(mockDashboardData);
}
