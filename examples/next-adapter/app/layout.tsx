import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeOS Adapter',
  description: 'Ingest → embeddings → research surfaces for the VibeOS stack.'
};

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/ingest', label: 'Ingest' },
  { href: '/corpus', label: 'Corpus' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/search', label: 'Search' },
  { href: '/timeline', label: 'Historian' },
  { href: '/api-manager', label: 'API Manager' },
  { href: '/library/prompts', label: 'Prompt Library' },
  { href: '/research', label: 'Research' },
  { href: '/workroom', label: 'Workroom' },
  { href: '/mvp', label: 'One-Shot MVP' },
  { href: '/play/map', label: 'Map' },
  { href: '/play/social', label: 'Social' }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: 'rgb(247, 247, 247)'
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgb(229, 229, 229)',
            padding: '12px 16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxWidth: 1240,
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 18 }}>VibeOS Adapter</strong>
              <span style={{ fontSize: 13, color: 'rgb(85, 85, 85)' }}>M1 · ingest → embeddings → search</span>
            </div>
            <nav
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.04)',
                    color: 'rgb(17, 17, 17)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '32px 16px 80px',
            width: '100%'
          }}
        >
          <div
            style={{
              background: 'rgb(255, 255, 255)',
              borderRadius: 16,
              padding: '24px min(5vw, 40px)',
              boxShadow: '0 12px 32px rgba(15,23,42,0.04)',
              minHeight: '60vh'
            }}
          >
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
