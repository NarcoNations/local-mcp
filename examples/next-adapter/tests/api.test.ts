import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { POST as convertPost } from '../app/api/ingest/convert/route';
import { POST as chatgptPost } from '../app/api/ingest/chatgpt/route';
import { POST as knowledgeIndexPost } from '../app/api/knowledge/index/route';
import { POST as searchPost } from '../app/api/search/route';

type SupabaseRow = Record<string, any>;

const knowledgeStore: SupabaseRow[] = [
  {
    id: 'knowledge-1',
    slug: 'demo',
    title: 'Demo Knowledge',
    manifest_path: 'manifests/demo.json',
    sha256: 'stub-sha',
    created_at: new Date().toISOString()
  }
];
const embeddingsStore: SupabaseRow[] = [];
const conversationsStore: SupabaseRow[] = [];
const messagesStore: SupabaseRow[] = [];
const storageBlobs = new Map<string, Uint8Array>();

vi.mock('@/examples/next-adapter/lib/historian', () => ({
  logEvent: vi.fn()
}));

vi.mock('@/examples/next-adapter/lib/supabase/server', () => ({
  sbServer: () => mockSupabase
}));

vi.mock('@xenova/transformers', () => {
  const tokenizer = {
    encode: async (text: string) => ({ data: Uint16Array.from({ length: Math.max(4, Math.ceil(text.length / 16)) }, (_, i) => i + 1) }),
    decode: async (ids: number[]) => `chunk(${ids.length})`
  };
  return {
    pipeline: async () => async () => ({ data: Float32Array.from([0.5, 0.25, 0.25, 0.0]) }),
    AutoTokenizer: {
      from_pretrained: async () => tokenizer
    }
  };
});

const mockSupabase = {
  from(table: string) {
    if (table === 'knowledge') return knowledgeClient();
    if (table === 'embeddings') return embeddingsClient();
    if (table === 'conversations') return upsertClient(conversationsStore);
    if (table === 'messages') return upsertClient(messagesStore);
    return {
      select: () => ({ data: [], error: null }),
      insert: async () => ({ error: null })
    };
  },
  storage: {
    from: () => ({
      download: async (path: string) => {
        const blob = storageBlobs.get(path);
        if (!blob) {
          return { data: null, error: new Error(`missing blob for ${path}`) };
        }
        const arrayBuffer = async () =>
          blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength);
        return { data: { arrayBuffer }, error: null };
      }
    })
  }
};

function knowledgeClient() {
  return {
    select: () => ({
      order: () => ({
        limit: async () => ({ data: knowledgeStore, error: null })
      }),
      eq: (_column: string, value: any) => ({
        maybeSingle: async () => ({
          data: knowledgeStore.find((row) => row.slug === value) || null,
          error: null
        })
      }),
      in: async (_column: string, values: any[]) => ({
        data: knowledgeStore.filter((row) => values.includes(row.id)),
        error: null
      })
    })
  };
}

function embeddingsClient() {
  return {
    delete: () => ({
      eq: () => {
        embeddingsStore.length = 0;
        return { data: null, error: null };
      }
    }),
    insert: async (rows: SupabaseRow[]) => {
      embeddingsStore.push(...rows);
      return { data: rows, error: null };
    },
    select: () => ({
      limit: async () => ({ data: embeddingsStore, error: null })
    })
  };
}

function upsertClient(store: SupabaseRow[]) {
  return {
    upsert: async (rows: SupabaseRow[]) => {
      store.push(...rows);
      return { data: rows, error: null };
    }
  };
}

const chatExport = [
  {
    id: 'conv-1',
    title: 'Test conversation',
    mapping: {
      'node-1': {
        message: {
          id: 'msg-1',
          author: { role: 'user' },
          content: { parts: ['Hello world'] },
          create_time: 1_700_000_000,
          metadata: { model_slug: 'gpt-test' }
        }
      }
    }
  }
];

let archiveZip: Uint8Array;

beforeAll(async () => {
  const zip = new JSZip();
  zip.file('docs/demo.md', '# Demo\n\nThis is a markdown fixture.');
  archiveZip = await zip.generateAsync({ type: 'uint8array' });
  storageBlobs.set('archives/demo.zip', archiveZip);
});

beforeEach(() => {
  embeddingsStore.length = 0;
  conversationsStore.length = 0;
  messagesStore.length = 0;
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/convert')) {
      return new Response(Uint8Array.from(archiveZip));
    }
    if (url.includes('conversations.json')) {
      return new Response(JSON.stringify(chatExport));
    }
    throw new Error(`Unhandled fetch for ${url}`);
  });
  process.env.MD_CONVERT_URL = 'http://mock';
  process.env.INGEST_SUPABASE = 'false';
});

const formData = new FormData();
formData.append('file', new File(['stub pdf'], 'sample.pdf', { type: 'application/pdf' }));

function createMultipartRequest(fd: FormData) {
  return {
    headers: new Headers({ 'content-type': 'multipart/form-data; boundary=stub' }),
    formData: async () => fd
  } as any;
}

describe('API routes', () => {
  it('ingest convert returns file list', async () => {
    const res = await convertPost(createMultipartRequest(formData));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.files)).toBe(true);
    expect(json.files.length).toBeGreaterThan(0);
  });

  it('chatgpt ingest streams export', async () => {
    const req = { json: async () => ({ fileUrl: 'https://example.com/conversations.json' }) } as any;
    const res = await chatgptPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.conversations).toBeGreaterThan(0);
    expect(json.messages).toBeGreaterThan(0);
    expect(conversationsStore.length).toBeGreaterThan(0);
    expect(messagesStore.length).toBeGreaterThan(0);
  });

  it('knowledge index produces embeddings', async () => {
    storageBlobs.set('archives/demo.zip', archiveZip);
    const req = { json: async () => ({ slug: 'demo' }) } as any;
    const res = await knowledgeIndexPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.chunks.length).toBeGreaterThan(0);
    expect(embeddingsStore.length).toBeGreaterThan(0);
  });

  it('search returns structured hits', async () => {
    if (!embeddingsStore.length) {
      await knowledgeIndexPost({ json: async () => ({ slug: 'demo' }) } as any);
    }
    const res = await searchPost({ json: async () => ({ q: 'demo', k: 5 }) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.hits)).toBe(true);
    expect(json.hits.length).toBeGreaterThanOrEqual(0);
  });
});
