import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const insertSpy = vi.fn();

vi.mock('next/server', () => ({
  NextRequest: class {},
}));

vi.mock('../examples/next-adapter/lib/supabase/server', () => ({
  sbServer: () => ({
    from: () => ({
      insert: insertSpy,
    }),
  }),
}));

vi.mock('../../examples/next-adapter/lib/supabase/server', () => ({
  sbServer: () => ({
    from: () => ({
      insert: insertSpy,
    }),
  }),
}));

// eslint-disable-next-line import/first
import { POST } from '../examples/next-adapter/app/api/historian/event/route';

describe('POST /api/historian/event', () => {
  beforeEach(() => {
    insertSpy.mockResolvedValue({ error: null });
    process.env.HISTORIAN_EVENT_TOKEN = 'secret';
  });

  afterEach(() => {
    insertSpy.mockReset();
  });

  it('rejects unauthorized requests when token mismatch', async () => {
    const res = await POST(
      new Request('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer nope' },
        body: JSON.stringify({ source: 'mcp', kind: 'watch', title: 'x' }),
      }) as any
    );
    expect(res.status).toBe(401);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('persists valid payloads', async () => {
    const res = await POST(
      new Request('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret' },
        body: JSON.stringify({
          source: 'mcp.watch',
          kind: 'watch.change',
          title: 'Changed file',
          session_id: 'abc',
          meta: { path: '/tmp/demo' },
        }),
      }) as any
    );
    expect(res.status).toBe(200);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const row = insertSpy.mock.calls[0][0];
    expect(row.session_id).toBe('abc');
    expect(row.meta).toEqual({ path: '/tmp/demo' });
  });
});
