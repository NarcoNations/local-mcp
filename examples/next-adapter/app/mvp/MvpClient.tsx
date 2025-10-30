'use client';

import { useState, useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function MvpClient({ briefs }: { briefs: any[] }) {
  const [title, setTitle] = useState('New Experiment');
  const [lanes, setLanes] = useState('["Research","Build"]');
  const [acceptance, setAcceptance] = useState('Ship baseline MVP with docs.');
  const [owner, setOwner] = useState('');
  const [isPending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      let parsedLanes: any = [];
      try {
        parsedLanes = JSON.parse(lanes || '[]');
      } catch (_) {
        parsedLanes = lanes;
      }
      await fetch('/api/mvp/briefs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({
          title,
          lanes: parsedLanes,
          acceptanceCriteria: acceptance,
          owner,
        }),
      });
    });
  };

  const generateBundle = (id: string) => {
    startTransition(async () => {
      await fetch('/api/mvp/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ briefId: id }),
      });
    });
  };

  const enqueueJob = (id: string, kind: string) => {
    startTransition(async () => {
      await fetch('/api/jobs/dispatch', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ kind, payload: { briefId: id } }),
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
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Draft Build Brief</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Lanes (JSON array)</span>
          <textarea value={lanes} onChange={(e) => setLanes(e.target.value)} rows={3} style={{ padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Acceptance Criteria</span>
          <textarea value={acceptance} onChange={(e) => setAcceptance(e.target.value)} rows={3} style={{ padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Owner</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} style={{ padding: '8px 10px' }} />
        </label>
        <button
          type="button"
          onClick={create}
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
          {isPending ? 'Saving…' : 'Create build brief'}
        </button>
      </section>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 16,
        }}
      >
        {briefs.map((brief) => (
          <article
            key={brief.id}
            style={{
              border: '1px solid var(--foreground-100,#f3f4f6)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <strong>{brief.title}</strong>
            <span>Status: {brief.status}</span>
            <span>Owner: {brief.owner || '—'}</span>
            <span>Acceptance: {brief.acceptance_criteria}</span>
            {brief.bundle_url && (
              <a href={brief.bundle_url} style={{ color: 'var(--accent-600,#0ea5e9)' }}>
                Download build bundle
              </a>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => generateBundle(brief.id)}
                disabled={isPending}
                style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--accent-500,#38bdf8)', background: 'white' }}
              >
                Generate ZIP
              </button>
              <button
                type="button"
                onClick={() => enqueueJob(brief.id, 'publish:site')}
                disabled={isPending}
                style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--foreground-200,#e5e7eb)', background: 'white' }}
              >
                Send to Publish
              </button>
              <button
                type="button"
                onClick={() => enqueueJob(brief.id, 'search-index')}
                disabled={isPending}
                style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--foreground-200,#e5e7eb)', background: 'white' }}
              >
                Re-index Search
              </button>
            </div>
          </article>
        ))}
        {!briefs.length && <p>No briefs recorded.</p>}
      </section>
    </div>
  );
}
