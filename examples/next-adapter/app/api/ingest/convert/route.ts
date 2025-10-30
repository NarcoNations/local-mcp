export const runtime = 'nodejs';
import { NextRequest } from 'next/server';

// Minimal skeleton — proxies file to md-convert; real implementation will
// stream multipart and optionally write to Supabase.
export async function POST(req: NextRequest) {
  try {
    const mdConvertUrl = process.env.MD_CONVERT_URL;
    if (!mdConvertUrl) return new Response('MD_CONVERT_URL not set', { status: 500 });

    // For now, just return a stub response to confirm deployment.
    return Response.json({ ok: true, note: 'convert route scaffold', mdConvertUrl });
  } catch (e: any) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
