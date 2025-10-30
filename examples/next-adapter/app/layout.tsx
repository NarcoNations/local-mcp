export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: 'linear-gradient(180deg, rgba(245,245,245,0.9) 0%, rgba(255,255,255,1) 60%)',
          color: 'rgba(20,20,20,0.9)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.92)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '12px clamp(16px, 4vw, 32px)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <a href="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.05rem' }}>
              VibeOS Adapter
            </a>
            <nav
              aria-label="Primary"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'clamp(8px, 2vw, 16px)',
                justifyContent: 'flex-end'
              }}
            >
              {[
                ['Ingest', '/ingest'],
                ['Corpus', '/corpus'],
                ['Timeline', '/timeline'],
                ['Workroom', '/workroom'],
                ['MVP', '/mvp'],
                ['Library', '/library/prompts'],
                ['Research', '/research'],
                ['Map', '/play/map'],
                ['Social', '/play/social'],
                ['Knowledge', '/knowledge'],
                ['Search', '/search'],
                ['API Manager', '/api-manager']
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: 'rgba(0,0,0,0.04)',
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main
          style={{
            flex: 1,
            width: '100%',
            padding: 'clamp(16px, 4vw, 40px)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ width: 'min(100%, 1080px)', margin: '0 auto' }}>{children}</div>
        </main>
        <footer
          style={{
            padding: '16px clamp(16px, 4vw, 32px)',
            fontSize: '0.85rem',
            color: 'rgba(0,0,0,0.55)',
            textAlign: 'center'
          }}
        >
          Built for the VibeOS Spec-Kit — responsive by default.
        </footer>
      </body>
    </html>
  );
}
