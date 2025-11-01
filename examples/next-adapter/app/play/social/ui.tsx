'use client';

import { useMemo, useState } from 'react';

interface QueueRow {
  id: string;
  template: string;
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  created_at: string;
}

interface AssetRow {
  id: string;
  queue_id: string;
  url: string | null;
  kind: string | null;
}

interface Props {
  queue: QueueRow[];
  assets: AssetRow[];
  enabled: boolean;
}

const TEMPLATES = [
  { id: 'briefing-card', label: 'Briefing Card' },
  { id: 'alert-slate', label: 'Alert Slate' },
];

export default function SocialPlayground({ queue, assets, enabled }: Props) {
  const [template, setTemplate] = useState(TEMPLATES[0]?.id ?? 'briefing-card');
  const [payload, setPayload] = useState('{"headline":"Vibe Check","body":"Stay alert."}');
  const [scheduledAt, setScheduledAt] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const groupedAssets = useMemo(() => {
    return assets.reduce<Record<string, AssetRow[]>>((acc, asset) => {
      if (!acc[asset.queue_id]) acc[asset.queue_id] = [];
      acc[asset.queue_id].push(asset);
      return acc;
    }, {});
  }, [assets]);

  async function renderAsset() {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/social/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, payload: JSON.parse(payload || '{}'), scheduled_at: scheduledAt || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Render failed');
      }
      setStatusMessage('Render queued. Use Historian to follow asset generation.');
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function publish(id: string) {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Publish failed');
      }
      setStatusMessage('Publish stub recorded. Connect n8n for live posting.');
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <main style={{ padding: '24px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Social Playground</h1>
        <p style={{ color: '#666' }}>Flip FF_SOCIAL_PIPELINE=true to unlock rendering & scheduling.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Social Publishing Pipeline</h1>
        <p style={{ color: '#4a5568' }}>
          Render Narco noir visuals and queue posts for n8n hand-off. Assets store in Supabase for future automation.
        </p>
        {statusMessage && <span>{statusMessage}</span>}
      </header>

      <section
        style={{
          border: '1px solid #1f2933',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 12,
          background: '#111827',
          color: '#e2e8f0',
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Template</span>
          <select
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
          >
            {TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Payload JSON</span>
          <textarea
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            style={{
              minHeight: 120,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#e2e8f0',
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Schedule (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
          />
        </label>
        <button
          onClick={renderAsset}
          disabled={loading}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#6366f1' : '#22d3ee',
            color: '#0f172a',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Rendering…' : 'Render Asset'}
        </button>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Queue</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {queue.map((item) => (
            <article
              key={item.id}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: 12,
                padding: 16,
                background: '#f8fafc',
                display: 'grid',
                gap: 8,
              }}
            >
              <strong>{item.template}</strong>
              <span>Status: {item.status}</span>
              <span>Scheduled: {item.scheduled_at || '—'}</span>
              <span>Created: {new Date(item.created_at).toLocaleString()}</span>
              {groupedAssets[item.id] && (
                <details>
                  <summary style={{ cursor: 'pointer' }}>Assets ({groupedAssets[item.id].length})</summary>
                  <ul style={{ paddingLeft: 18 }}>
                    {groupedAssets[item.id].map((asset) => (
                      <li key={asset.id}>
                        <a href={asset.url ?? '#'} target="_blank" rel="noreferrer">
                          {asset.kind}: {asset.url || 'pending'}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <button
                onClick={() => publish(item.id)}
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
                Publish (stub)
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
