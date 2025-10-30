"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "../hooks/useTheme";
import { useShortcuts } from "../hooks/useShortcuts";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { CommandPalette, type CommandPaletteItem } from "./CommandPalette";
import { Icon, type IconName } from "./icons";
import { cn } from "../utils/cn";

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Ingest", href: "/ingest", icon: "ingest" },
  { label: "Corpus", href: "/corpus", icon: "corpus" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Historian", href: "/timeline", icon: "historian" },
  { label: "API Manager", href: "/api-manager", icon: "api" },
  { label: "Workroom", href: "/workroom", icon: "workroom" },
  { label: "MVP", href: "/mvp", icon: "mvp" },
  { label: "Prompt Library", href: "/library/prompts", icon: "prompts" },
  { label: "Research", href: "/research", icon: "research" },
  { label: "Map", href: "/play/map", icon: "map" },
  { label: "Social", href: "/play/social", icon: "social" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

const fadeInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const breadcrumb = useMemo(() => {
    if (pathname === "/") return "Dashboard";
    const match = navItems.find((item) => item.href === pathname);
    return match?.label ?? "Workspace";
  }, [pathname]);

  const paletteItems: CommandPaletteItem[] = useMemo(
    () => [
      ...navItems.map((item) => ({
        id: item.href,
        label: item.label,
        description: `Navigate to ${item.label}`,
        href: item.href,
      })),
      {
        id: "upload",
        label: "Upload file",
        description: "Jump to ingest pipeline",
        href: "/ingest",
      },
      {
        id: "new-brief",
        label: "New MVP brief",
        description: "Open the MVP generator",
        href: "/mvp",
      },
      {
        id: "focus-search",
        label: "Focus global search",
        description: "Jump to the search input",
        onSelect: () => searchInputRef.current?.focus(),
      },
      {
        id: "toggle-theme",
        label: "Toggle theme",
        description: "Switch between Narco Noir and VibeLabz Clean",
        onSelect: toggleTheme,
      },
    ],
    [toggleTheme]
  );

  const shortcuts = useMemo(
    () => [
      {
        key: "k",
        withMeta: true,
        preventDefault: true,
        handler: () => {
          setPaletteOpen(true);
          return true;
        },
      },
      {
        key: "k",
        withCtrl: true,
        preventDefault: true,
        handler: () => {
          setPaletteOpen(true);
          return true;
        },
      },
      {
        key: "/",
        preventDefault: true,
        handler: (event: KeyboardEvent) => {
          if ((event.target as HTMLElement | null)?.tagName === "INPUT") {
            return false;
          }
          searchInputRef.current?.focus();
          return true;
        },
      },
      {
        key: "t",
        handler: () => {
          toggleTheme();
          return true;
        },
      },
    ],
    [toggleTheme]
  );

  useShortcuts(shortcuts);

  const nav = (
    <nav className="flex h-full flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
              isActive
                ? "bg-accent-soft text-primary"
                : "text-muted hover:bg-accent-soft hover:text-primary"
            )}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : fadeInLeft;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.aside
            key="sidebar-mobile"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-6 border-r border-border bg-surface p-6 shadow-raised lg:hidden"
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="text-base font-semibold text-primary">
                VibeOS
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="focus-ring rounded-full border border-border p-2"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            {nav}
          </motion.aside>
        ) : null}
      </AnimatePresence>
      <aside className="hidden border-r border-border bg-surface p-6 lg:flex lg:flex-col lg:gap-6">
        <div>
          <Link href="/" className="text-lg font-semibold text-primary">
            VibeOS Ultimate
          </Link>
          <p className="mt-1 text-xs text-muted">Narco Noir • VibeLabz Clean</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-2" role="navigation">
          {nav}
        </div>
        <div className="rounded-2xl border border-border bg-surface-elevated p-4 text-xs text-muted">
          <p className="font-medium text-primary">Shortcuts</p>
          <ul className="mt-2 space-y-1">
            <li><kbd className="shortcut">⌘K</kbd> / <kbd className="shortcut">Ctrl+K</kbd> • Command palette</li>
            <li><kbd className="shortcut">/</kbd> • Focus search</li>
            <li><kbd className="shortcut">T</kbd> • Toggle theme</li>
          </ul>
        </div>
      </aside>
      <div className="flex flex-1 flex-col bg-background">
        <header
          className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(16,22,32,0.68)]"
          role="banner"
        >
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="focus-ring rounded-full border border-border p-2 lg:hidden"
                aria-label="Open navigation"
              >
                ☰
              </button>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.18em] text-muted">
                  VibeOS Systems
                </span>
                <span className="text-base font-semibold text-primary">{breadcrumb}</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <div className="relative flex w-full items-center">
                <span className="pointer-events-none absolute left-3 text-muted">⌕</span>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search across knowledge, corpus, prompts..."
                  className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated py-2 pl-10 pr-16 text-sm text-primary placeholder:text-[color:rgba(148,163,184,0.8)]"
                  aria-label="Global search"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.currentTarget.value.trim()) {
                      router.push(`/search?q=${encodeURIComponent(event.currentTarget.value.trim())}`);
                      event.currentTarget.blur();
                    }
                  }}
                />
                <kbd className="pointer-events-none absolute right-3 rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                  /
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="focus-ring rounded-full border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-primary"
                onClick={() => setPaletteOpen(true)}
              >
                ⌘K
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="focus-ring rounded-full border border-border bg-surface-elevated p-2"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                <span className="font-medium text-primary">Agent</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-background px-4 pb-16 pt-6 lg:px-8" role="main">
          <div className="mx-auto w-full max-w-[1400px] space-y-8 pb-16">{children}</div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
    </div>
  );
}
