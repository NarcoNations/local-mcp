import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ id: `ing-${Date.now()}` });
}
