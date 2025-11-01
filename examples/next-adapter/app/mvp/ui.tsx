'use client';

import { useState } from 'react';

type Brief = {
  id: string;
  title: string;
  lanes: any[];
  acceptance_criteria: string | null;
  owner: string | null;
  status: string;
  attachment_url: string | null;
  created_at: string;
};

interface Props {
  briefs: Brief[];
}

export default function MvpDashboard({ briefs }: Props) {
  const [items, setItems] = useState(briefs);
  const [title, setTitle] = useState('NarcoNations intel dashboard');
  const [owner, setOwner] = useState('Ops');
  const [lanes, setLanes] = useState('[{"name":"Discover"},{"name":"Ship"}]');
  const [criteria, setCriteria] = useState('Users can explore incidents on map and export briefs.');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createBrief() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mvp/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, owner, lanes: JSON.parse(lanes || '[]'), acceptance_criteria: criteria }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create brief');
      }
      setItems((prev) => [json.brief, ...prev]);
      setMessage('Brief captured. Generate build docs or send to jobs.');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generate(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mvp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate');
      }
      setItems((prev) => prev.map((brief) => (brief.id === id ? json.brief : brief)));
      setMessage('Build brief generated. Download the attachment to kick-off engineering.');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function dispatch(id: string, jobKind: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/mvp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, jobKind }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to dispatch');
      }
      setMessage(`Dispatched ${jobKind}. Track progress in Historian/jobs.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>One‑Shot MVP Builder</h1>
        <p style={{ color: '#4a5568' }}>
          Capture briefs from the Workroom and turn them into actionable build docs with automated job dispatch.
        </p>
        {message && <span>{message}</span>}
      </header>

      <section
        style={{
          border: '1px solid #1f2937',
          borderRadius: 12,
          padding: 16,
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'grid',
          gap: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Owner</span>
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Lanes (JSON)</span>
          <textarea
            value={lanes}
            onChange={(event) => setLanes(event.target.value)}
            style={{ minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Acceptance Criteria</span>
          <textarea
            value={criteria}
            onChange={(event) => setCriteria(event.target.value)}
            style={{ minHeight: 90, padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
          />
        </label>
        <button
          onClick={createBrief}
          disabled={loading}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#475569' : '#22d3ee',
            color: '#0f172a',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Saving…' : 'Capture Brief'}
        </button>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Briefs</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {items.map((brief) => (
            <article
              key={brief.id}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: 12,
                padding: 16,
                background: '#f8fafc',
                display: 'grid',
                gap: 8,
              }}
            >
              <strong>{brief.title}</strong>
              <span>Status: {brief.status}</span>
              <span>Owner: {brief.owner ?? '—'}</span>
              <span>Created: {new Date(brief.created_at).toLocaleString()}</span>
              <details>
                <summary style={{ cursor: 'pointer' }}>Acceptance Criteria</summary>
                <p>{brief.acceptance_criteria || '—'}</p>
              </details>
              {brief.attachment_url && (
                <a
                  href={brief.attachment_url}
                  style={{ color: '#2563eb', fontWeight: 600 }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Build Brief
                </a>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  onClick={() => generate(brief.id)}
                  disabled={loading}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #111827',
                    background: '#111827',
                    color: '#f1f5f9',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  Generate Docs
                </button>
                <button
                  onClick={() => dispatch(brief.id, 'publish:site')}
                  disabled={loading}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #134e4a',
                    background: '#134e4a',
                    color: '#ecfdf5',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  Send to Publish
                </button>
                <button
                  onClick={() => dispatch(brief.id, 'search-index')}
                  disabled={loading}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #1d4ed8',
                    background: '#1d4ed8',
                    color: '#eff6ff',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  Rebuild Search
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
