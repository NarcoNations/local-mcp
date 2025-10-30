const sections = [
  {
    title: 'Ingest & Convert',
    description: 'Upload markdown or PDFs, stream to storage, and build manifests for embeddings.',
    href: '/ingest'
  },
  {
    title: 'ChatGPT Corpus',
    description: 'Import exports into conversations and messages with historian logs.',
    href: '/corpus'
  },
  {
    title: 'Knowledge Index',
    description: 'View vault entries and trigger local embeddings via Xenova.',
    href: '/knowledge'
  },
  {
    title: 'Semantic Search',
    description: 'Query cosine similarity across indexed chunks with provenance.',
    href: '/search'
  },
  {
    title: 'Historian Timeline',
    description: 'Filter key events across ingest, API calls, and research tasks.',
    href: '/timeline'
  },
  {
    title: 'API Manager',
    description: 'Probe feeds and model routing with in-memory caching.',
    href: '/api-manager'
  },
  {
    title: 'Whiteboard Workroom',
    description: 'Plan across departments, capture stickies, and export briefs.',
    href: '/workroom'
  },
  {
    title: 'One-Shot MVP',
    description: 'Feed a brief and receive a zipped architecture + routes + data model.',
    href: '/mvp'
  }
];

export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 40px)' }}>
      <section
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          alignItems: 'stretch'
        }}
      >
        <div
          style={{
            gridColumn: '1 / -1',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: '18px',
            padding: 'clamp(20px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(1.9rem, 4vw, 2.5rem)' }}>VibeOS Core Adapter</h1>
          <p style={{ margin: 0, maxWidth: 720 }}>
            Delivering ingest → embeddings → search alongside Historian, API Manager, and rapid planning surfaces.
            Everything is tuned for local-first workflows and responsive layouts from mobile to desktop.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <a
              href="/ingest"
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                background: 'rgba(0,0,0,0.12)',
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Start Ingest
            </a>
            <a
              href="/search"
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(0,0,0,0.2)',
                color: 'inherit',
                textDecoration: 'none'
              }}
            >
              Run a Search
            </a>
          </div>
        </div>
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            style={{
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minHeight: '180px'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{section.title}</h2>
            <p style={{ margin: 0, flex: 1, fontSize: '0.95rem', lineHeight: 1.5 }}>{section.description}</p>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Open →</span>
          </a>
        ))}
      </section>
    </div>
  );
}
