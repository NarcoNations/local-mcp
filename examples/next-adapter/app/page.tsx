import type { CSSProperties } from 'react';

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(168,85,247,0.12))',
  borderRadius: '24px',
  padding: '48px 32px',
  display: 'grid',
  gap: '16px'
};

const sectionGridStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  marginTop: '32px'
};

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '18px',
  padding: '20px',
  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const linkStyle: CSSProperties = {
  fontWeight: 600,
  color: 'rgba(37,99,235,0.95)'
};

const checklistStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

export default function Page() {
  return (
    <main style={{ padding: '32px 0', display: 'grid', gap: '32px' }}>
      <section style={heroStyle}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', lineHeight: 1.1 }}>VibeOS Core</h1>
        <p style={{ margin: 0, maxWidth: '60ch', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Local-first ingest, embeddings, and research tooling. Stream PDFs into knowledge, embed with MiniLM on CPU, search
          via cosine similarity, and orchestrate your studio from the Historian timeline to the Workroom canvas.
        </p>
        <ul style={checklistStyle}>
          <li>✅ Streaming ingest for Markdown + ChatGPT exports</li>
          <li>✅ Supabase storage, pgvector embeddings, cosine search</li>
          <li>✅ Historian telemetry across APIs, research, and workroom</li>
        </ul>
      </section>

      <section style={sectionGridStyle}>
        <div style={cardGridStyle}>
          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>Ingest & Corpus</h2>
            <p style={{ margin: 0 }}>Upload sources, convert to Markdown, and hydrate conversations.</p>
            <a href="/ingest" style={linkStyle}>Convert documents</a>
            <a href="/corpus" style={linkStyle}>Import ChatGPT exports</a>
          </article>
          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>Knowledge & Search</h2>
            <p style={{ margin: 0 }}>Index to pgvector, embed locally, and query across knowledge packs.</p>
            <a href="/knowledge" style={linkStyle}>Manage knowledge</a>
            <a href="/search" style={linkStyle}>Run vector search</a>
          </article>
          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>Ops & Historian</h2>
            <p style={{ margin: 0 }}>API telemetry with Alpha feeds, LLM routing, and event timelines.</p>
            <a href="/api-manager" style={linkStyle}>API manager probes</a>
            <a href="/timeline" style={linkStyle}>Review timeline</a>
          </article>
          <article style={cardStyle}>
            <h2 style={{ margin: 0 }}>Creative Surfaces</h2>
            <p style={{ margin: 0 }}>Whiteboard OS, prompt library, research engine, and playgrounds.</p>
            <a href="/workroom" style={linkStyle}>Open Workroom</a>
            <a href="/library/prompts" style={linkStyle}>Explore prompts</a>
          </article>
        </div>
      </section>
    </main>
  );
}
