export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            padding: '12px min(4vw, 32px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <strong>VibeOS Adapter</strong>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/">Home</a>
            <a href="/ingest">Ingest</a>
            <a href="/corpus">Corpus</a>
            <a href="/timeline">Historian</a>
            <a href="/workroom">Workroom</a>
            <a href="/mvp">One‑Shot MVP</a>
            <a href="/library/prompts">Prompt Library</a>
            <a href="/research">Research Engine</a>
            <a href="/play/map">Map Playground</a>
            <a href="/play/social">Social Playground</a>
            <a href="/knowledge">Knowledge</a>
            <a href="/search">Search</a>
            <a href="/api-manager">API Manager</a>
          </nav>
        </header>
        <div style={{ width: 'min(1100px, 100%)', margin: '0 auto', padding: '0 min(4vw, 32px)' }}>{children}</div>
      </body>
    </html>
  );
}
