export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: 'var(--surface, #f9fafb)' }}>
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: 18 }}>VibeOS Adapter</strong>
            <span style={{ fontSize: 11, color: 'rgba(15,23,42,0.55)' }}>Production &amp; Autonomy Stack</span>
          </div>
          <nav
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              fontSize: 13,
              justifyContent: 'flex-end',
            }}
          >
            <a href="/">Home</a>
            <a href="/timeline">Historian</a>
            <a href="/workroom">Workroom</a>
            <a href="/mvp">One‑Shot MVP</a>
            <a href="/metrics">Metrics</a>
            <a href="/evals">Eval Lab</a>
            <a href="/policy">Policy</a>
            <a href="/publish">Publish</a>
            <a href="/library/prompts">Prompts</a>
            <a href="/research">Research</a>
            <a href="/play/map">Map</a>
            <a href="/play/social">Social</a>
            <a href="/knowledge">Knowledge</a>
            <a href="/search">Search</a>
            <a href="/api-manager">API Manager</a>
          </nav>
        </header>
        <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%', paddingBottom: 64 }}>{children}</div>
      </body>
    </html>
  );
}
