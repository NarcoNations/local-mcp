import { describe, it, expect, vi, afterEach } from 'vitest';
import JSZip from 'jszip';

vi.mock('../lib/historian', () => ({ logEvent: vi.fn() }));

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

describe('API smoke tests', () => {
  it('converts uploaded documents via md-convert', async () => {
    const { POST } = await import('../app/api/ingest/convert/route');

    const zip = new JSZip();
    zip.file('notes/sample.md', '# Sample Doc');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    global.fetch = vi.fn(async (input) => {
      if (typeof input === 'string' && input.includes('/convert')) {
        return new Response(buffer, { headers: { 'Content-Type': 'application/zip' } });
      }
      return new Response('{}', { status: 200 });
    });

    process.env.MD_CONVERT_URL = 'https://md-convert.test';
    process.env.INGEST_SUPABASE = 'false';

    const file = new File([new Uint8Array([1, 2, 3])], 'sample.pdf', { type: 'application/pdf' });
    const form = new FormData();
    form.append('file', file);

    const req = new Request('http://localhost/api/ingest/convert', { method: 'POST', body: form });
    const res = await POST(req as any);
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.files)).toBe(true);
    expect(json.files.length).toBeGreaterThan(0);
  });

  it('ingests ChatGPT exports via streaming parser', async () => {
    const mockProcessor = vi.fn().mockResolvedValue({ conversations: 2, messages: 5 });
    vi.doMock('../lib/corpus/chatgpt', () => ({ processChatExportFromUrl: mockProcessor }));
    const { POST } = await import('../app/api/ingest/chatgpt/route');

    const req = new Request('http://localhost/api/ingest/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: 'http://localhost/export.json' })
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.conversations).toBeGreaterThan(0);
    expect(json.messages).toBeGreaterThan(0);
    expect(mockProcessor).toHaveBeenCalledTimes(1);
  });

  it('indexes knowledge chunks by slug', async () => {
    const mockIndexer = vi.fn().mockResolvedValue({ knowledgeId: 'abc', slug: 'demo', chunks: 4, details: [] });
    vi.doMock('../lib/knowledge/indexer', () => ({ indexKnowledge: mockIndexer }));
    const { POST } = await import('../app/api/knowledge/index/route');

    const req = new Request('http://localhost/api/knowledge/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'demo' })
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.chunks).toBeGreaterThan(0);
    expect(mockIndexer).toHaveBeenCalledWith({ slug: 'demo', knowledgeId: undefined, source: 'knowledge', emitEvent: true });
  });

  it('performs semantic search against embeddings', async () => {
    vi.doMock('../lib/embeddings/model', () => ({ embedText: vi.fn().mockResolvedValue([0.5, 0.5]) }));
    vi.doMock('../lib/supabase/server', () => ({
      sbServer: () => ({
        from: () => ({
          select: () => ({
            limit: async () => ({
              data: [
                {
                  knowledge_id: 'k1',
                  chunk_ix: 0,
                  content: 'Sample chunk',
                  embedding: [0.5, 0.5],
                  knowledge: { slug: 'demo', title: 'Demo Doc' }
                }
              ],
              error: null
            })
          })
        })
      })
    }));
    const { POST } = await import('../app/api/search/route');

    const req = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'test query' })
    });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.results[0]).toHaveProperty('score');
  });
});
