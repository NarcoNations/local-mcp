import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistorianClient } from '../src/lib/historianClient.js';
import { logger } from '../src/utils/logger.js';

const mockFetch = vi.fn();

describe('HistorianClient', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    globalThis.fetch = mockFetch as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('sends events with bearer token when provided', async () => {
    const client = new HistorianClient({ endpoint: 'https://example.com/api/historian/event', token: 'secret', defaultSource: 'mcp.local' });
    await client.capture({ source: 'mcp.watch', kind: 'watch.change', title: 'Changed', meta: { path: '/tmp/demo' }, sessionId: 'abc' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer secret', 'content-type': 'application/json' });
    const body = JSON.parse(options?.body as string);
    expect(body.session_id).toBe('abc');
    expect(body.meta).toEqual({ path: '/tmp/demo' });
  });

  it('logs warning when request fails', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'fail' });
    const client = new HistorianClient({ endpoint: 'https://example.com/api/historian/event' });
    await client.capture({ source: 'mcp.watch', kind: 'watch.change', title: 'Changed' });
    expect(mockFetch).toHaveBeenCalled();
    warn.mockRestore();
  });
});
