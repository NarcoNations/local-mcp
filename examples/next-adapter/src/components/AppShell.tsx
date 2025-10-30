'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Aperture,
  BookOpen,
  Brain,
  Clock3,
  Command,
  FolderGit2,
  Globe2,
  Home,
  Inbox,
  Layers,
  Menu,
  MonitorPlay,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { CommandPalette } from './CommandPalette';
import { useTheme } from '../hooks/useTheme';
import { useShortcuts } from '../hooks/useShortcuts';

interface AppShellProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  section?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Ingest', href: '/ingest', icon: UploadCloud },
  { label: 'Corpus', href: '/corpus', icon: Inbox },
  { label: 'Knowledge', href: '/knowledge', icon: Brain },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Historian', href: '/timeline', icon: Clock3 },
  { label: 'API Manager', href: '/api-manager', icon: FolderGit2 },
  { label: 'Workroom', href: '/workroom', icon: Layers },
  { label: 'MVP', href: '/mvp', icon: Sparkles },
  { label: 'Prompt Library', href: '/library/prompts', icon: BookOpen },
  { label: 'Research', href: '/research', icon: MonitorPlay },
  { label: 'Map Playground', href: '/play/map', icon: Globe2 },
  { label: 'Social Playground', href: '/play/social', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const routeTitleMap = new Map(
  NAV_ITEMS.map((item) => [item.href, item.label] as const),
);

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle, isDark } = useTheme();
  const searchInputs = React.useRef(new Set<HTMLInputElement>());
  const registerSearchInput = React.useCallback((input: HTMLInputElement | null) => {
    const collection = searchInputs.current;
    if (input) {
      collection.add(input);
    } else {
      collection.forEach((existing) => {
        if (!existing.isConnected) {
          collection.delete(existing);
        }
      });
    }
  }, []);

  const focusSearchInput = React.useCallback(() => {
    for (const input of searchInputs.current) {
      if (input.offsetParent !== null) {
        input.focus();
        return;
      }
    }
  }, []);
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isPaletteOpen, setPaletteOpen] = React.useState(false);

  const currentTitle = routeTitleMap.get(pathname) ?? 'Workspace';

  const commands = React.useMemo(
    () => [
      ...NAV_ITEMS.map((item) => ({
        id: item.href,
        label: item.label,
        href: item.href,
        section: 'Navigation',
      })),
      {
        id: 'upload-file',
        label: 'Upload file',
        description: 'Convert local files into ingestible knowledge.',
        href: '/ingest',
        section: 'Quick Actions',
      },
      {
        id: 'new-brief',
        label: 'Draft new MVP brief',
        description: 'Launch the MVP generator panel.',
        href: '/mvp',
        section: 'Quick Actions',
      },
      {
        id: 'focus-search',
        label: 'Focus search',
        description: 'Jump to the global search input.',
        onSelect: focusSearchInput,
        section: 'Commands',
        shortcut: '/',
      },
      {
        id: 'toggle-theme',
        label: 'Toggle theme',
        description: 'Switch between Narco Noir and VibeLabz Clean.',
        onSelect: toggle,
        section: 'Commands',
        shortcut: 'T',
      },
    ],
    [focusSearchInput, toggle],
  );

  useShortcuts([
    {
      combo: 'meta+k',
      handler: (event) => {
        event.preventDefault();
        setPaletteOpen(true);
      },
      preventDefault: true,
    },
    {
      combo: 'ctrl+k',
      handler: (event) => {
        event.preventDefault();
        setPaletteOpen(true);
      },
      preventDefault: true,
    },
    {
      combo: '/',
      handler: (event) => {
        event.preventDefault();
        focusSearchInput();
      },
      preventDefault: true,
    },
    {
      combo: 't',
      handler: () => toggle(),
      allowInInputs: false,
    },
  ]);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') ?? '').trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              key="mobile-overlay"
              className="fixed inset-0 z-40 bg-[color:var(--overlay-scrim)] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        <motion.aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-[color:var(--color-sidebar)] px-4 py-6 backdrop-blur-xl transition-transform duration-300 ease-spring-snappy lg:static lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
          data-glass
          initial={false}
          animate={{ x: 0 }}
        >
          <div className="flex items-center justify-between gap-3 px-1">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated shadow-sm">
                <Aperture className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <span>VibeOS Ultimate</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-interactive hover:text-foreground lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <nav className="mt-8 flex-1 overflow-y-auto" aria-label="Primary">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-interactive focus-visible:outline-none focus-visible:ring-0',
                      isActive
                        ? 'bg-[color:var(--color-accent-soft)] text-foreground shadow-sm'
                        : 'text-muted hover:bg-surface-elevated hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="mt-auto rounded-lg border border-border bg-surface-elevated p-4 text-xs text-muted">
            <p className="font-semibold text-foreground">Historian Sync</p>
            <p className="mt-1 leading-relaxed">
              // EDIT HERE: drop status copy or link to pipeline insights.
            </p>
          </div>
        </motion.aside>
        <div className="flex flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-40 border-b border-border bg-[color:var(--color-header)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-interactive hover:text-foreground lg:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-muted">{theme === 'dark' ? 'Narco Noir' : 'VibeLabz Clean'}</span>
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  {currentTitle}
                  <span className="text-xs font-medium uppercase tracking-wide text-gold">M1</span>
                </div>
              </div>
              <form
                onSubmit={handleSearchSubmit}
                className="relative hidden max-w-xl flex-1 items-center gap-2 rounded-full border border-border bg-surface-subdued px-4 py-2 text-sm shadow-sm transition-colors duration-interactive focus-within:border-[color:var(--color-accent)] focus-within:text-foreground sm:flex"
                role="search"
                aria-label="Global search"
              >
                <Search className="h-4 w-4 text-muted" aria-hidden="true" />
                <input
                  ref={registerSearchInput}
                  name="q"
                  aria-label="Search knowledge base"
                  placeholder="Search across knowledge, corpus, prompts..."
                  className="flex-1 bg-transparent placeholder:text-muted focus:outline-none"
                />
                <kbd className="hidden rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted sm:block">
                  /
                </kbd>
              </form>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted transition-colors duration-interactive hover:text-foreground sm:inline-flex"
                >
                  <Command className="h-3.5 w-3.5" aria-hidden="true" />
                  Cmd+K
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-interactive hover:text-foreground"
                  aria-label="Toggle theme"
                  aria-pressed={isDark}
                >
                  {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                </button>
                <div className="flex items-center gap-3 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-muted">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-subdued text-foreground">
                    <Aperture className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="hidden flex-col leading-tight sm:flex">
                    <span className="font-semibold text-foreground">Ops Lead</span>
                    <span className="text-[11px] uppercase tracking-wide">Command Center</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:hidden">
              <form
                onSubmit={handleSearchSubmit}
                className="mx-4 mb-3 flex items-center gap-2 rounded-full border border-border bg-surface-subdued px-4 py-2 text-sm shadow-sm"
                role="search"
                aria-label="Global search"
              >
                <Search className="h-4 w-4 text-muted" aria-hidden="true" />
                <input
                  ref={registerSearchInput}
                  name="q"
                  placeholder="Search across systems"
                  className="flex-1 bg-transparent placeholder:text-muted focus:outline-none"
                />
                <span className="text-[11px] font-semibold text-muted">/</span>
              </form>
            </div>
          </header>
          <main className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <CommandPalette open={isPaletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
