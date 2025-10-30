export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <strong>VibeOS Adapter</strong>
          <nav
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <a href="/">Home</a>
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
            <a href="/metrics">Metrics</a>
            <a href="/evals">Eval Lab</a>
            <a href="/policy">Policy</a>
            <a href="/publish">Publish</a>
          </nav>
        </header>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 12px' }}>{children}</div>
      </body>
    </html>
  );
}
