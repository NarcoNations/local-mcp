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
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-12">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold uppercase tracking-[0.32em] text-text-muted">Narco Nations</span>
                <span className="text-lg font-semibold text-text">VibeOS Control Deck</span>
              </div>
              <nav aria-label="Primary" className="flex flex-wrap items-center gap-3 text-sm lg:gap-4">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={twMerge(
                      'rounded-full px-3 py-1.5 font-medium text-text-muted transition-colors hover:bg-surface-muted/70 hover:text-text focus-visible:bg-surface-muted focus-visible:text-text',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className={clsx('flex-1 pb-16')}>{children}</main>
          <footer className="border-t border-border/60 bg-surface/80">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-6 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between lg:px-12">
              <p>Narco Nations × VibeLabz — phase two prototype.</p>
              <div className="flex flex-wrap gap-3">
                <Link className="hover:text-text" href="/dept/strategy-board">
                  Strategy Board
                </Link>
                <Link className="hover:text-text" href="/dept/ideas-lab">
                  Ideas Lab
                </Link>
                <a className="hover:text-text" href="https://narconations.com" target="_blank" rel="noreferrer">
                  NarcoNations.com
                </a>
              </div>
            </div>
          </footer>
        </div>
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
