'use client';

import { useState } from 'react';

export interface SectionCardProps {
  title: string;
  badge: string;
  status?: 'live' | 'beta' | 'planned';
  description: string;
  actionLabel: string;
  endpoint: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  footnote?: string;
}

function statusLabel(status?: SectionCardProps['status']) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'beta':
      return 'Beta';
    case 'planned':
      return 'Planned';
    default:
      return undefined;
  }
}

export function SectionCard({
  title,
  badge,
  status,
  description,
  actionLabel,
  endpoint,
  method = 'GET',
  body,
  footnote
}: SectionCardProps) {
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState('');

  const runAction = async () => {
    setPending(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResponse(`⚠️ ${message}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="card">
      <header className="card-header">
        <h2 className="card-title">{title}</h2>
        <span className="badge">{badge}</span>
        {statusLabel(status) && <span className={`status status-${status}`}>{statusLabel(status)}</span>}
      </header>
      <div className="card-content">
        <p>{description}</p>
        <button className="cta-button" type="button" onClick={runAction} disabled={pending}>
          {pending ? 'Working…' : actionLabel}
        </button>
        {footnote && <p className="footnote">{footnote}</p>}
        {response && <div className="response-panel" aria-live="polite">{response}</div>}
      </div>
    </article>
  );
}
