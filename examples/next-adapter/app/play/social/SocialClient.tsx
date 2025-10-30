'use client';

import { useState, useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function SocialClient({
  queue,
}: {
  queue: { id: string; template: string; status: string; scheduled_at: string | null; posted_at: string | null }[];
}) {
  const [template, setTemplate] = useState('default');
  const [payload, setPayload] = useState('{"headline":"New drop"}');
  const [scheduled, setScheduled] = useState('');
  const [isPending, startTransition] = useTransition();

  const render = () => {
    startTransition(async () => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(payload || '{}');
      } catch (_) {
        parsed = { raw: payload };
      }
      await fetch('/api/social/render', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ template, payload: parsed, scheduled_at: scheduled || null }),
      });
    });
  };

  const publish = (id: string) => {
    startTransition(async () => {
      await fetch('/api/social/publish', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ queueId: id }),
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section
        style={{
          border: '1px solid var(--foreground-200,#e5e7eb)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Render Template</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Template</span>
          <input
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--foreground-200,#e5e7eb)' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Payload (JSON)</span>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--foreground-200,#e5e7eb)' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Schedule (ISO)</span>
          <input
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--foreground-200,#e5e7eb)' }}
          />
        </label>
        <button
          type="button"
          onClick={render}
          disabled={isPending}
          style={{
            padding: '10px 14px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent-600,#0ea5e9)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Rendering…' : 'Queue render job'}
        </button>
      </section>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        {queue.map((row) => (
          <article
            key={row.id}
            style={{
              border: '1px solid var(--foreground-100,#f3f4f6)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <strong>{row.template}</strong>
            <span>ID: {row.id}</span>
            <span>Status: {row.status}</span>
            <span>Scheduled: {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : '—'}</span>
            <button
              type="button"
              onClick={() => publish(row.id)}
              disabled={isPending}
              style={{
                marginTop: 'auto',
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: 'var(--accent-600,#0ea5e9)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Publish (stub)
            </button>
          </article>
        ))}
        {!queue.length && <p>No social assets queued.</p>}
      </section>
    </div>
  );
}
