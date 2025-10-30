export const runtime = 'nodejs';
import { NextRequest } from 'next/server';

// Skeleton for streaming a ChatGPT export URL into DB via background job.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.fileUrl) return new Response('fileUrl required', { status: 400 });
    // TODO: dispatch background job (n8n/task) with fileUrl to process via stream-json.
    return Response.json({ ok: true, note: 'chatgpt ingest scaffold', received: body.fileUrl });
  } catch (e: any) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
