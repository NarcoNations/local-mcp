export const runtime = 'nodejs';
import { NextRequest } from 'next/server';
import JSZip from 'jszip';
import { logEvent } from '@/examples/next-adapter/lib/historian';

type BriefJson = {
  generatedAt?: string;
  notes?: { id: string; lane: string; text: string; createdAt?: string }[];
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const briefRaw = form.get('brief');
    const brief = typeof briefRaw === 'string' ? briefRaw.trim() : '';
    if (!brief) return new Response('brief is required', { status: 400 });

    let board: BriefJson | null = null;
    const file = form.get('briefJson');
    if (file instanceof File) {
      try {
        const text = await file.text();
        board = JSON.parse(text);
      } catch (_) {
        board = null;
      }
    }

    const zip = new JSZip();
    zip.file('ARCHITECTURE.md', buildArchitecture(brief, board));
    zip.file('ROUTES.md', buildRoutes(brief));
    zip.file('DATA_MODEL.md', buildDataModel(board));

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    await logEvent({
      source: 'mvp',
      kind: 'mvp.generate',
      title: 'MVP brief generated',
      meta: {
        briefLength: brief.length,
        notes: Array.isArray(board?.notes) ? board!.notes!.length : 0
      }
    });

    const payload = Uint8Array.from(buffer);
    return new Response(payload, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="vibeos-mvp.zip"'
      }
    });
  } catch (err: any) {
    await logEvent({
      source: 'mvp',
      kind: 'error',
      title: 'MVP generator failed',
      body: err?.message || String(err)
    });
    return new Response('Error: ' + (err?.message || 'unknown'), { status: 500 });
  }
}

function buildArchitecture(brief: string, board: BriefJson | null) {
  const summary = brief.length > 320 ? brief.slice(0, 320).trimEnd() + '…' : brief;
  const laneSummary = summariseLanes(board);
  return `# Architecture Overview\n\n## Mission\n${summary}\n\n## Core Layers\n- Ingest → Markdown convert → Supabase storage\n- Knowledge → Embeddings (MiniLM, pgvector)\n- Search → Cosine ranking + Historian\n- API Manager → Feeds + LLM routing\n- Workroom → Whiteboard OS hand-offs\n\n## Lanes & Focus\n${laneSummary}\n\n> Generated with One-Shot MVP stub — expand each section before sprint planning.\n`;
}

function buildRoutes(brief: string) {
  return `# Routes\n\n| Path | Purpose |\n| --- | --- |\n| / | Dashboard overview |\n| /ingest | Upload docs → md-convert pipeline |\n| /corpus | ChatGPT export ingestion |\n| /knowledge | Knowledge archive + embeddings |\n| /search | Semantic search UI |\n| /timeline | Historian events |\n| /api-manager | Feed + LLM probes |\n| /workroom | Whiteboard OS lanes |\n| /mvp | One-Shot MVP generator |\n\n## Notes\n- Brief: ${brief.slice(0, 140).replace(/\n/g, ' ')}${brief.length > 140 ? '…' : ''}\n- Add auth + persona gating in follow-up milestones.\n`;
}

function buildDataModel(board: BriefJson | null) {
  const laneTable = summariseLaneTable(board);
  return `# Data Model\n\n## Knowledge\n- knowledge(id, slug, title, manifest_path, sha256)\n- knowledge_files(id, knowledge_id, path, content_type, bytes)\n- embeddings(id, knowledge_id, chunk_ix, content, embedding)\n\n## Corpus\n- conversations(id, title, created_at, updated_at, source)\n- messages(id, conversation_id, author, role, model, text)\n- events(id, ts, source, kind, title, meta)\n\n## Workroom Export\n${laneTable}\n\n> Extend with tags + historian snapshots as the product matures.\n`;
}

function summariseLanes(board: BriefJson | null) {
  if (!board?.notes?.length) return '- No board export attached.';
  const byLane = new Map<string, number>();
  for (const note of board.notes) {
    const key = note.lane || 'Unknown';
    byLane.set(key, (byLane.get(key) || 0) + 1);
  }
  return Array.from(byLane.entries())
    .map(([lane, count]) => `- **${lane}** · ${count} sticky${count === 1 ? '' : ' notes'}`)
    .join('\n');
}

function summariseLaneTable(board: BriefJson | null) {
  if (!board?.notes?.length) return '- No stickies captured.';
  const lines = ['| Lane | Notes |', '| --- | --- |'];
  const byLane = new Map<string, string[]>();
  for (const note of board.notes) {
    const lane = note.lane || 'Unknown';
    if (!byLane.has(lane)) byLane.set(lane, []);
    byLane.get(lane)!.push(note.text.replace(/\s+/g, ' ').slice(0, 80));
  }
  for (const [lane, items] of byLane.entries()) {
    lines.push(`| ${lane} | ${items.join('<br/>')} |`);
  }
  return lines.join('\n');
}
