import Link from 'next/link';

const sections = [
  {
    title: 'Ingest Pipeline',
    description: 'Upload MD/PDF and stream to Supabase Storage with Historian logging.',
    href: '/ingest'
  },
  {
    title: 'ChatGPT Corpus',
    description: 'Stream massive exports into conversations/messages with tagging hooks.',
    href: '/corpus'
  },
  {
    title: 'Knowledge & Embeddings',
    description: 'Review archives, trigger MiniLM embeddings, and check manifest metadata.',
    href: '/knowledge'
  },
  {
    title: 'Semantic Search',
    description: 'Query embeddings with cosine similarity and provenance context.',
    href: '/search'
  },
  {
    title: 'Historian Timeline',
    description: 'Inspect the event log, filter by source/kind, and audit API runs.',
    href: '/timeline'
  },
  {
    title: 'API Manager',
    description: 'Probe market-data feeds and route LLM calls via the API manager.',
    href: '/api-manager'
  }
];

export default function Page() {
  return (
    <main style={{ display: 'grid', gap: 32 }}>
      <section style={{ display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>VibeOS Adapter Dashboard</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          This adapter delivers the M1 flow: ingest Markdown/PDF, embed locally with Xenova MiniLM, search via pgvector, and expose
          operations in a free-tier friendly Next.js 14 surface.
        </p>
      </section>
      <section
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}
      >
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            style={{
              display: 'grid',
              gap: 12,
              padding: '20px 22px',
              borderRadius: 14,
              background: 'rgb(252, 252, 252)',
              border: '1px solid rgb(229, 229, 229)',
              textDecoration: 'none',
              color: 'rgb(17, 17, 17)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <strong style={{ fontSize: 18 }}>{section.title}</strong>
            <span style={{ fontSize: 14, color: 'rgb(85, 85, 85)' }}>{section.description}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(10, 124, 45)' }}>Open →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
