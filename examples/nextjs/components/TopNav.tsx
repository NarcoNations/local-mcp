'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const links = [
  { href: '/', label: 'Home' },
  { href: '/whiteboard', label: 'Whiteboard' },
  { href: '/code-mixer', label: 'Code Mixer' },
  { href: '/research-engine', label: 'Research Engine' },
  { href: '/prompt-lab', label: 'Prompt Lab' },
  { href: '/one-shot-mvp', label: 'One-Shot MVP' },
  { href: '/archivist', label: 'Archivist' },
  { href: '/multiformat-output', label: 'Multi-format' },
  { href: '/persona-engine', label: 'Persona Engine' },
  { href: '/api-manager', label: 'API Manager' },
  { href: '/llm-router', label: 'LLM Router' },
  { href: '/crime-map', label: 'Crime Map' },
  { href: '/social-playground', label: 'Social Playground' },
  { href: '/historian', label: 'Historian' }
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="top-nav" role="navigation" aria-label="Primary">
      <div className="nav-upper">
        <div className="brand">
          <span className="brand-mark">VibeMixer</span>
          <span className="brand-sub">NarcoNations control surface</span>
        </div>
        <ThemeToggle />
      </div>
      <nav className="nav-links">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`nav-link${active ? ' nav-link-active' : ''}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
