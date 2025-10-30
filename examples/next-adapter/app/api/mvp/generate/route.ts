export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import JSZip from 'jszip';
import { logEvent } from '@/examples/next-adapter/lib/historian';

type LaneSummary = Record<string, { text: string; created_at: string }[]>;

type BriefPayload = {
  generated_at: string;
  lanes?: LaneSummary;
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const brief = typeof form.get('brief') === 'string' ? (form.get('brief') as string) : '';
    const briefFile = form.get('briefJson');

    let board: BriefPayload | null = null;
    if (briefFile instanceof File && briefFile.size > 0) {
      try {
        board = JSON.parse(await briefFile.text());
      } catch (err: any) {
        return new Response('Invalid brief.json uploaded', { status: 400 });
      }
    }

    const zip = new JSZip();
    zip.file('ARCHITECTURE.md', buildArchitectureDoc(brief, board));
    zip.file('ROUTES.md', buildRoutesDoc(brief, board));
    zip.file('DATA_MODEL.md', buildDataModelDoc(brief, board));

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    await logEvent({
      source: 'mvp',
      kind: 'api.mvp',
      title: 'MVP stub generated',
      meta: {
        brief: brief.trim().length > 0,
        lanes: board?.lanes ? Object.keys(board.lanes).length : 0
      }
    });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="mvp-stub.zip"'
      }
    });
  } catch (e: any) {
    await logEvent({
      source: 'mvp',
      kind: 'error',
      title: 'MVP generation failed',
      body: e?.message || 'unknown'
    });
    return new Response('Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}

function buildArchitectureDoc(brief: string, board: BriefPayload | null) {
  const lines: string[] = ['# Architecture Overview', '', '## Narrative Brief', '', brief.trim() || '_No brief provided._'];
  if (board?.lanes) {
    lines.push('', '## Studio Lanes', '');
    for (const [lane, stickies] of Object.entries(board.lanes)) {
      lines.push(`### ${lane}`, '');
      if (!stickies.length) {
        lines.push('- _(empty)_', '');
        continue;
      }
      for (const sticky of stickies) {
        lines.push(`- ${sticky.text}`);
      }
      lines.push('');
    }
  }
  lines.push('', '## System Layers', '', '- Interfaces → Web (Next.js)', '- Knowledge → Supabase pgvector', '- Compute → Node runtimes + edge-friendly tasks', '- Ops → Supabase Storage, Alpha Vantage feed, local embeddings');
  return lines.join('\n');
}

function buildRoutesDoc(brief: string, board: BriefPayload | null) {
  const coreRoutes = ['GET /api/feeds/alpha', 'POST /api/ingest/convert', 'POST /api/knowledge/index', 'POST /api/search', 'POST /api/llm'];
  const lines = ['# Routes Sketch', '', 'Core endpoints seeded from the adapter:', ''];
  for (const route of coreRoutes) lines.push(`- ${route}`);
  if (brief.trim()) {
    lines.push('', '## Notes', '', `> ${brief.trim().slice(0, 280)}${brief.trim().length > 280 ? '…' : ''}`);
  }
  if (board?.lanes?.['Product Management']) {
    lines.push('', '## Candidate MVP user flows');
    for (const sticky of board.lanes['Product Management']) {
      lines.push(`- ${sticky.text}`);
    }
  }
  return lines.join('\n');
}

function buildDataModelDoc(brief: string, board: BriefPayload | null) {
  const lines = ['# Data Model Notes', '', '## Existing Tables', '', '- knowledge', '- knowledge_files', '- embeddings', '- events', '- conversations', '- messages'];
  if (board?.lanes?.Research?.length) {
    lines.push('', '## Research Inputs');
    for (const sticky of board.lanes.Research) {
      lines.push(`- ${sticky.text}`);
    }
  }
  if (brief.trim()) {
    lines.push('', '## Brief Signals', '', brief.trim());
  }
  return lines.join('\n');
}
