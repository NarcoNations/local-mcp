'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../providers/ThemeProvider';
import { useShortcuts } from '../hooks/useShortcuts';
import { CommandPalette, CommandPaletteItem } from './CommandPalette';
import { cn } from '../lib/cn';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '🌀', description: 'Mission control' },
  { label: 'Ingest', href: '/ingest', icon: '⬆️', description: 'Upload or convert data' },
  { label: 'Corpus', href: '/corpus', icon: '🗂️', description: 'Chat archives + raw data' },
  { label: 'Knowledge', href: '/knowledge', icon: '🧠', description: 'Indexed knowledge graph' },
  { label: 'Search', href: '/search', icon: '🔍', description: 'Semantic retrieval' },
  { label: 'Historian', href: '/timeline', icon: '🕰️', description: 'Observe system events' },
  { label: 'API Manager', href: '/api-manager', icon: '🛰️', description: 'Probe LLM + functions' },
  { label: 'Workroom', href: '/workroom', icon: '🧩', description: 'Sticky lane workspace' },
  { label: 'MVP', href: '/mvp', icon: '🚀', description: 'One-shot MVP briefs' },
  { label: 'Prompts', href: '/library/prompts', icon: '🎛️', description: 'Prompt library' },
  { label: 'Research', href: '/research', icon: '🔬', description: 'Research composer' },
  { label: 'Map', href: '/play/map', icon: '🗺️', description: 'Spatial intelligence' },
  { label: 'Social', href: '/play/social', icon: '🪩', description: 'Narrative studio' },
  { label: 'Settings', href: '/settings', icon: '⚙️', description: 'System preferences' },
] as const;

const breadcrumbsMap: Record<string, string> = {
  '/': 'Dashboard',
  '/ingest': 'Ingest',
  '/corpus': 'Corpus',
  '/knowledge': 'Knowledge',
  '/search': 'Search',
  '/timeline': 'Historian',
  '/workroom': 'Workroom',
  '/mvp': 'MVP',
  '/library/prompts': 'Prompt Library',
  '/research': 'Research',
  '/play/map': 'Map Playground',
  '/play/social': 'Social Playground',
  '/api-manager': 'API Manager',
  '/settings': 'Settings',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { toggleTheme } = useTheme();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const pageTitle = breadcrumbsMap[pathname] ?? 'Workspace';

  const commandItems: CommandPaletteItem[] = useMemo(() => {
    const navigationCommands = navItems.map((item) => ({
      id: item.href,
      label: item.label,
      description: item.description,
      href: item.href,
      group: 'Navigate',
    }));

    const actionCommands: CommandPaletteItem[] = [
      {
        id: 'action-upload',
        label: 'Upload file for ingestion',
        description: 'Jump to Ingest and open uploader',
        action: () => router.push('/ingest#upload'),
        group: 'Actions',
      },
      {
        id: 'action-mvp',
        label: 'Compose new MVP brief',
        description: 'Launch the MVP generator',
        action: () => router.push('/mvp#composer'),
        group: 'Actions',
      },
      {
        id: 'action-focus-search',
        label: 'Focus global search',
        description: 'Move cursor to the command bar search',
        action: () => searchRef.current?.focus(),
        group: 'Actions',
      },
      {
        id: 'action-toggle-theme',
        label: 'Toggle theme',
        description: 'Switch between Narco Noir and VibeLabz Clean',
        action: toggleTheme,
        group: 'Actions',
      },
    ];

    return [...navigationCommands, ...actionCommands];
  }, [router, toggleTheme]);

  const handleGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (data.get('global-search') as string | null)?.trim();
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const focusSearch = () => {
    searchRef.current?.focus();
  };

  useShortcuts({
    onOpenPalette: () => setPaletteOpen(true),
    onToggleTheme: toggleTheme,
    onFocusSearch: focusSearch,
  });

  const renderNavItems = () => (
    <ul className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition focus:outline-none focus-visible:focus-ring-offset',
                isActive
                  ? 'bg-[hsl(var(--color-cyan)/0.18)] text-foreground shadow-subtle'
                  : 'text-muted hover:bg-[hsl(var(--color-cyan)/0.12)] hover:text-foreground',
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'glass-only-light fixed inset-y-0 left-0 z-40 w-72 -translate-x-full bg-surface-subdued/90 px-4 py-6 transition-transform duration-300 ease-out md:static md:translate-x-0 md:bg-transparent md:px-6',
            isSidebarOpen && 'translate-x-0 shadow-subtle',
          )}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-2xl" aria-hidden>
                🌀
              </span>
              <span>VibeOS</span>
            </Link>
            <button
              type="button"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>
          <nav aria-label="Primary" className="mt-6 flex-1 overflow-y-auto pr-2">
            {renderNavItems()}
          </nav>
          <footer className="mt-6 hidden text-xs text-muted md:block">Narco Noir ↔ VibeLabz Clean</footer>
        </aside>

        <AnimatePresence>
          {isSidebarOpen ? (
            <motion.button
              key="overlay"
              type="button"
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            />
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-screen flex-1 flex-col md:pl-72">
          <header className="sticky top-0 z-20 border-b border-[hsl(var(--color-border)/0.35)] bg-background/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-8">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 text-lg md:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                ☰
              </button>
              <div className="hidden flex-col md:flex">
                <span className="text-xs uppercase text-muted">VibeOS Ultimate</span>
                <span className="text-lg font-semibold text-foreground">{pageTitle}</span>
              </div>
              <div className="flex flex-1 items-center justify-center md:justify-start">
                <form
                  role="search"
                  aria-label="Global search"
                  className="relative w-full max-w-xl"
                  onSubmit={handleGlobalSearch}
                >
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">⌕</span>
                  <input
                    ref={searchRef}
                    id="global-search"
                    name="global-search"
                    placeholder="Search across ingest, corpus, knowledge..."
                    className="w-full rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 py-2 pl-9 pr-24 text-sm text-foreground outline-none focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
                    type="search"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 hidden items-center gap-1 text-[11px] text-muted sm:flex">
                    <span className="rounded-md border border-[hsl(var(--color-border)/0.6)] bg-background/70 px-1">/</span>
                    <span className="rounded-md border border-[hsl(var(--color-border)/0.6)] bg-background/70 px-1">enter</span>
                  </div>
                </form>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="hidden rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground lg:flex"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Open command palette"
                >
                  ⌘K
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 p-2 text-lg"
                >
                  🌓
                </button>
                <span className="hidden items-center gap-2 rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 px-3 py-2 text-sm font-medium md:inline-flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--color-cyan)/0.15)] text-base font-semibold">
                    VO
                  </span>
                  <span className="hidden flex-col leading-tight lg:flex">
                    <span className="text-xs uppercase text-muted">Operator</span>
                    <span>VibeLabz</span>
                  </span>
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground md:hidden"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Open command palette"
                >
                  ⌘K
                </button>
              </div>
            </div>
          </header>
          <main role="main" className="flex-1 bg-background/80 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} items={commandItems} />
    </div>
  );
}
