import type React from 'react';
import { sbServer } from '../../lib/supabase/server';

type EventRow = {
  id: string;
  ts: string;
  source: string;
  kind: string;
  title: string;
  body?: string | null;
  link?: string | null;
  meta?: Record<string, unknown> | null;
  severity?: 'debug' | 'info' | 'warn' | 'error' | null;
  session_id?: string | null;
};

const containerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 'clamp(16px, 4vw, 32px)',
  padding: 'clamp(16px, 5vw, 48px) 0',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 'clamp(12px, 2vw, 24px)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
};

const cardBase: React.CSSProperties = {
  borderRadius: '18px',
  padding: 'clamp(16px, 3vw, 24px)',
  display: 'grid',
  gap: '12px',
  background: 'rgba(255,255,255,0.92)',
  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
  backdropFilter: 'blur(6px)',
};

const severityAccent: Record<string, string> = {
  debug: 'rgba(59,130,246,0.25)',
  info: 'rgba(14,165,233,0.25)',
  warn: 'rgba(251,191,36,0.35)',
  error: 'rgba(248,113,113,0.4)',
};

function formatDate(ts: string) {
  try {
    const date = new Date(ts);
    return date.toLocaleString();
  } catch {
    return ts;
  }
}

function EventCard({ event }: { event: EventRow }) {
  const accent = severityAccent[event.severity || 'info'] ?? severityAccent.info;
  return (
    <article
      style={{
        ...cardBase,
        border: `1px solid rgba(15,23,42,0.08)`,
        background: `linear-gradient(160deg, ${accent}, rgba(255,255,255,0.92))`,
      }}
    >
      <header style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,23,42,0.6)' }}>
          {event.source} · {event.kind}
        </span>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.05rem, 1.2vw + 0.9rem, 1.3rem)', lineHeight: 1.3 }}>{event.title}</h2>
      </header>
      <dl style={{ display: 'grid', gap: 6, margin: 0 }}>
        <div style={{ display: 'grid', gap: 2 }}>
          <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(15,23,42,0.55)', letterSpacing: '0.08em' }}>Captured</dt>
          <dd style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(event.ts)}</dd>
        </div>
        {event.session_id ? (
          <div style={{ display: 'grid', gap: 2 }}>
            <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(15,23,42,0.55)', letterSpacing: '0.08em' }}>Session</dt>
            <dd style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>{event.session_id}</dd>
          </div>
        ) : null}
        {event.body ? (
          <div style={{ display: 'grid', gap: 2 }}>
            <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(15,23,42,0.55)', letterSpacing: '0.08em' }}>Details</dt>
            <dd style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{event.body}</dd>
          </div>
        ) : null}
        {event.link ? (
          <div style={{ display: 'grid', gap: 2 }}>
            <dt style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(15,23,42,0.55)', letterSpacing: '0.08em' }}>Link</dt>
            <dd style={{ margin: 0 }}>
              <a href={event.link} style={{ color: 'rgba(37,99,235,0.9)', fontWeight: 600 }}>
                Open resource
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      {event.meta && Object.keys(event.meta).length ? (
        <details style={{ borderTop: '1px solid rgba(15,23,42,0.1)', paddingTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>Metadata</summary>
          <pre style={{ margin: '12px 0 0', fontSize: '0.85rem', background: 'rgba(15,23,42,0.08)', padding: '12px', borderRadius: '12px', overflowX: 'auto' }}>
            {JSON.stringify(event.meta, null, 2)}
          </pre>
        </details>
      ) : null}
    </article>
  );
}

export default async function TimelinePage() {
  const sb = sbServer();
  const { data } = await sb
    .from('events')
    .select('*')
    .order('ts', { ascending: false })
    .limit(60);

  return (
    <main style={containerStyle}>
      <section
        style={{
          borderRadius: '24px',
          padding: 'clamp(24px, 6vw, 48px)',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(236,72,153,0.15))',
          display: 'grid',
          gap: '12px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 2.8vw, 2.6rem)' }}>Historian Timeline</h1>
        <p style={{ margin: 0, maxWidth: '60ch', fontSize: 'clamp(1rem, 1.1vw + 0.9rem, 1.2rem)', lineHeight: 1.6 }}>
          Live feed of MCP file watchers, ingest flows, and API telemetry written to Supabase. Configure the Historian endpoint
          to capture your local automations alongside cloud adapters.
        </p>
      </section>

      <section style={gridStyle}>
        {(data && data.length > 0) ? (
          data.map((event: EventRow) => <EventCard key={event.id} event={event} />)
        ) : (
          <article
            style={{
              ...cardBase,
              alignSelf: 'stretch',
              textAlign: 'center',
              background: 'linear-gradient(160deg, rgba(59,130,246,0.18), rgba(255,255,255,0.95))',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2vw, 1.6rem)' }}>No events yet</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Hit the MCP `watch` tool or send a POST to `/api/historian/event` to seed the Historian timeline.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
