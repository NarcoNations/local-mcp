import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: `'Inter', 'Segoe UI', sans-serif`,
  background: 'rgb(245,247,250)',
  color: 'rgb(15,23,42)'
};

const shellStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px 48px 20px',
  width: '100%'
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/ingest', label: 'Ingest' },
  { href: '/corpus', label: 'Corpus' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/search', label: 'Search' },
  { href: '/timeline', label: 'Historian' },
  { href: '/api-manager', label: 'API Manager' },
  { href: '/workroom', label: 'Workroom' },
  { href: '/mvp', label: 'One-Shot MVP' },
  { href: '/library/prompts', label: 'Prompt Library' },
  { href: '/research', label: 'Research Engine' },
  { href: '/play/map', label: 'Map Playground' },
  { href: '/play/social', label: 'Social Playground' }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          a { color: inherit; text-decoration: none; }
          a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible {
            outline: 2px solid rgba(59,130,246,0.8);
            outline-offset: 2px;
          }
        `}</style>
        <header style={headerStyle}>
          <div style={brandStyle}>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>VibeOS Adapter</span>
            <span style={{ color: 'rgba(15,23,42,0.6)', fontSize: '0.9rem' }}>Ingest → Knowledge → Ops Surface</span>
          </div>
          <nav style={navStyle}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={navLinkStyle}>
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <div style={shellStyle}>{children}</div>
      </body>
    </html>
  );
}

const headerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  width: '100%',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(15,23,42,0.08)',
  padding: '12px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const brandStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const navStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center'
};

const navLinkStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'rgba(15,23,42,0.08)',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'background 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center'
};
