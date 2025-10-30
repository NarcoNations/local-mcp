import { NextResponse } from 'next/server';
import { mockPrompts } from '../../../../../src/mocks/prompts';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const prompt = mockPrompts.find((item) => item.id === params.id);
  return NextResponse.json({ output: prompt ? prompt.body : 'Prompt executed.' });
}
