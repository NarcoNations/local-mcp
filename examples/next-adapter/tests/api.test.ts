import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import JSZip from 'jszip';
import { NextRequest } from 'next/server';

import { POST as convertPost } from '@/examples/next-adapter/app/api/ingest/convert/route';
import { POST as chatgptPost } from '@/examples/next-adapter/app/api/ingest/chatgpt/route';
import { POST as knowledgePost } from '@/examples/next-adapter/app/api/knowledge/index/route';
import { POST as searchPost } from '@/examples/next-adapter/app/api/search/route';

vi.mock('@/examples/next-adapter/lib/corpus/chatgpt', () => ({
  processChatExportFromUrl: vi.fn(async () => ({ conversations: 2, messages: 5 }))
}));

vi.mock('@/examples/next-adapter/lib/knowledge/indexer', () => ({
  indexKnowledgeBySlug: vi.fn(async () => ({ knowledgeId: '123', slug: 'demo', chunks: 3 })),
  indexKnowledgeById: vi.fn(async () => ({ knowledgeId: '123', slug: 'demo', chunks: 3 }))
}));

vi.mock('@/examples/next-adapter/lib/knowledge/search', () => ({
  searchKnowledgeEmbeddings: vi.fn(async () => [
    { knowledge_id: '123', slug: 'demo', title: 'Demo', chunk_ix: 0, content: 'Chunk', score: 0.91 }
  ])
}));

beforeEach(() => {
  vi.stubGlobal('fetch', async (input: any) => {
    if (typeof input === 'string' && input.includes('md-convert')) {
      const zip = new JSZip();
      zip.file('sample.md', '# Demo file');
      const blob = await zip.generateAsync({ type: 'blob' });
      return new Response(blob, { status: 200 });
    }
    return new Response('{}', { status: 200 });
  });
  process.env.MD_CONVERT_URL = 'http://md-convert.test';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API routes', () => {
  it('converts uploads via md-convert', async () => {
    const form = new FormData();
    form.append('file', new File([new TextEncoder().encode('PDF data')], 'demo.pdf', { type: 'application/pdf' }));
    const req = new NextRequest('http://localhost/api/ingest/convert', {
      method: 'POST',
      body: form as any
    });
    const res = await convertPost(req);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.files)).toBe(true);
    expect(json.files.length).toBeGreaterThan(0);
  });

  it('ingests chatgpt export via stub', async () => {
    const req = new NextRequest('http://localhost/api/ingest/chatgpt', {
      method: 'POST',
      body: JSON.stringify({ fileUrl: 'http://example.com/export.json' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await chatgptPost(req);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.conversations).toBeGreaterThan(0);
    expect(json.messages).toBeGreaterThan(0);
  });

  it('indexes knowledge by slug', async () => {
    const req = new NextRequest('http://localhost/api/knowledge/index', {
      method: 'POST',
      body: JSON.stringify({ slug: 'demo' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await knowledgePost(req);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.chunks).toBeGreaterThan(0);
  });

  it('returns search results stub', async () => {
    const req = new NextRequest('http://localhost/api/search', {
      method: 'POST',
      body: JSON.stringify({ q: 'test' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await searchPost(req);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.results)).toBe(true);
    expect(json.results.length).toBeGreaterThan(0);
  });
});
