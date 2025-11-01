'use client';

import { useState } from 'react';

type PolicyLog = {
  id: string;
  scope: string;
  action: string;
  status: string;
  reasons: string[] | null;
  created_at: string;
  payload: Record<string, any> | null;
};

interface Props {
  logs: PolicyLog[];
  enabled: boolean;
}

export default function PolicyBoard({ logs, enabled }: Props) {
  const [items, setItems] = useState(logs);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rerun(id: string) {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch('/api/policy/recheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to rerun');
      }
      setItems((prev) => [
        {
          id: crypto.randomUUID(),
          scope: prev.find((log) => log.id === id)?.scope ?? 'policy',
          action: prev.find((log) => log.id === id)?.action ?? 'policy',
          status: json.result.passed ? 'pass' : 'fail',
          reasons: json.result.reasons,
          created_at: new Date().toISOString(),
          payload: prev.find((log) => log.id === id)?.payload ?? null,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  if (!enabled) {
    return (
      <main style={{ padding: '32px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Policy Gate</h1>
        <p style={{ color: '#666' }}>Enable FF_MAP_PIPELINE or FF_SOCIAL_PIPELINE to activate the Ethics Council.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Ethics Council — Policy Gate</h1>
        <p style={{ color: '#4a5568' }}>
          Review the latest gated actions and shadow-self summaries. Manual re-runs append a fresh review entry.
        </p>
        {error && <span style={{ color: '#c53030' }}>{error}</span>}
      </header>

      <div style={{ display: 'grid', gap: 16 }}>
        {items.map((log) => (
          <article
            key={log.id}
            style={{
              border: '1px solid #2d3748',
              borderRadius: 12,
              padding: 16,
              background: log.status === 'pass' ? '#0c2416' : '#300d17',
              color: log.status === 'pass' ? '#c6f6d5' : '#fed7e2',
              display: 'grid',
              gap: 8,
            }}
          >
            <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{log.action}</h2>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Scope: {log.scope}</span>
              </div>
              <button
                onClick={() => rerun(log.id)}
                disabled={loadingId === log.id}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: loadingId === log.id ? 'wait' : 'pointer',
                }}
              >
                {loadingId === log.id ? 'Re-running…' : 'Re-run' }
              </button>
            </header>
            <p>Status: {log.status}</p>
            {Array.isArray(log.reasons) && log.reasons.length > 0 ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {log.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            ) : (
              <span>No issues detected.</span>
            )}
            {log.payload?.content && (
              <details>
                <summary style={{ cursor: 'pointer' }}>Shadow Self / Payload</summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.85rem',
                    background: 'rgba(0,0,0,0.2)',
                    padding: 12,
                    borderRadius: 10,
                  }}
                >
                  {log.payload.content}
                </pre>
              </details>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
