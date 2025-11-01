import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  MemoryCache,
  routeFeed,
  runLLM,
} from '../packages/api-manager/src/index.js';
import type { FeedResult, LLMRun } from '../packages/api-manager/src/types.js';

const tempDir = path.join(os.tmpdir(), 'api-manager-test');

function createMockResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  fs.mkdirSync(tempDir, { recursive: true });
  process.env.PROMPT_RUNS_LOG = path.join(tempDir, `prompt-runs-${Date.now()}.jsonl`);
});

afterEach(() => {
  delete process.env.ALPHA_VANTAGE_KEY;
  delete process.env.FINNHUB_KEY;
  delete process.env.TIINGO_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.PROMPT_RUNS_LOG;
  vi.restoreAllMocks();
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('routeFeed', () => {
  it('normalises alpha vantage quote responses and caches subsequent calls', async () => {
    process.env.ALPHA_VANTAGE_KEY = 'demo';
    const fetchSpy = vi.fn(async (input: any) => {
      const url = new URL(String(input));
      const fn = url.searchParams.get('function');
      if (fn === 'GLOBAL_QUOTE') {
        return createMockResponse({
          'Global Quote': {
            '01. symbol': 'SPY',
            '05. price': '456.12',
            '07. latest trading day': '2024-08-01',
          },
        });
      }
      throw new Error(`unexpected function ${fn}`);
    });
    const fetcher = fetchSpy as unknown as typeof fetch;
    const cache = new MemoryCache({ maxEntries: 10 });
    const result = await routeFeed(
      { provider: 'alpha', resource: 'quote', symbol: 'SPY' },
      { cache, fetcher }
    );
    expect(result.provider).toBe('alpha');
    expect((result.data as FeedResult['data']).symbol).toBe('SPY');
    expect(result.cached).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const cached = await routeFeed(
      { provider: 'alpha', resource: 'quote', symbol: 'SPY' },
      { cache, fetcher }
    );
    expect(cached.cached).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('runLLM', () => {
  it('falls back to local model when hint requests local', async () => {
    const run: LLMRun = { task: 'summarize', prompt: 'Summarise the timeline', modelHint: 'local-only' };
    const result = await runLLM(run);
    expect(result.provider).toBe('local');
    expect(result.output).toContain('[LOCAL');
  });

  it('uses remote provider when available and records response', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const fetchSpy = vi.fn(async () =>
      createMockResponse({ choices: [{ message: { content: 'Hello world' } }] })
    );
    const fetcher = fetchSpy as unknown as typeof fetch;
    const run: LLMRun = { task: 'summarize', prompt: 'Say hello', modelHint: 'cloud' };
    const result = await runLLM(run, { fetcher });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(result.provider).toBe('openai');
    expect(result.output).toBe('Hello world');
    expect(result.costEst).toBeGreaterThan(0);
  });

  it('falls back to local when remote provider fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const fetchSpy = vi.fn(async () => createMockResponse({}, 500));
    const fetcher = fetchSpy as unknown as typeof fetch;
    const run: LLMRun = { task: 'draft_copy', prompt: 'Write copy', modelHint: 'openai' };
    const result = await runLLM(run, { fetcher });
    expect(fetchSpy).toHaveBeenCalled();
    expect(result.provider).toBe('local');
    expect(result.output).toContain('[LOCAL FALLBACK');
  });
});
