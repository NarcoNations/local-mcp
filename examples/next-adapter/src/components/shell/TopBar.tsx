"use client";

import { motion } from "framer-motion";
import { Menu, MoonStar, Search, SunMedium } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

interface TopBarProps {
  title: ReactNode;
  description?: ReactNode;
  onMenuClick: () => void;
  onOpenPalette: () => void;
  onThemeToggle: () => void;
  theme: "light" | "dark";
  searchRef: React.RefObject<HTMLInputElement>;
  onSearch: (query: string) => void;
  paletteOpen: boolean;
}

export function TopBar({
  title,
  description,
  onMenuClick,
  onOpenPalette,
  onThemeToggle,
  theme,
  searchRef,
  onSearch,
  paletteOpen,
}: TopBarProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(searchValue.trim());
  };

  return (
    <motion.header
      layout
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-6"
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-border/60 p-2 text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm uppercase tracking-[0.35em] text-muted/70">VibeOS Ultimate</div>
          <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
          {description && <p className="mt-1 truncate text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <form
          onSubmit={handleSubmit}
          className="relative flex min-w-[160px] max-w-md flex-1 items-center"
          role="search"
          aria-label="Global search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={searchRef}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full rounded-full border border-border/60 bg-surface-muted/70 py-2 pl-9 pr-3 text-sm text-foreground transition focus:border-highlight/80 focus:ring-0"
            placeholder="Search the vibe matrix"
            aria-label="Search all systems"
          />
        </form>
        <button
          type="button"
          onClick={onThemeToggle}
          className="hidden items-center gap-2 rounded-full border border-border/60 px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted transition hover:border-highlight/70 hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:inline-flex"
        >
          {theme === "dark" ? (
            <SunMedium className="h-4 w-4" aria-hidden />
          ) : (
            <MoonStar className="h-4 w-4" aria-hidden />
          )}
          <span>Theme</span>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="inline-flex items-center gap-2 rounded-full border border-highlight/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-highlight transition hover:bg-highlight/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
          aria-haspopup="dialog"
          aria-expanded={paletteOpen}
        >
          <span>Cmd</span>
          <span className="text-muted">+</span>
          <span>K</span>
        </button>
        <div
          className="hidden shrink-0 items-center gap-2 rounded-full border border-border/60 bg-surface-muted/60 px-3 py-2 text-xs font-medium text-muted/80 sm:flex"
          role="group"
          aria-label="User status"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-highlight/15 text-sm font-semibold text-highlight">NN</span>
          <div className="text-left">
            <p className="font-semibold uppercase tracking-[0.2em] text-muted/70">Operator</p>
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-muted">Online</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
