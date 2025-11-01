import './globals.css';
import type { Metadata } from 'next';
import { clsx } from 'clsx';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

export const metadata: Metadata = {
  title: 'VibeOS Ultimate Dashboard',
  description: 'Narco Nations × VibeLabz — adaptive operating system shell built for strategy, research, and creation.'
};

const navLinks = [
  { href: '/', label: 'Overview' },
  { href: '/timeline', label: 'Historian' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/library/prompts', label: 'Prompt Library' },
  { href: '/research', label: 'Research' },
  { href: '/search', label: 'Search' },
  { href: '/play/map', label: 'Map' },
  { href: '/play/social', label: 'Social Lab' },
  { href: '/api-manager', label: 'API Feeds' }
];

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
