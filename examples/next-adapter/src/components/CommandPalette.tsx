'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { cn } from '../lib/cn';

type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  group?: string;
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

export function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) =>
      [item.label, item.description, item.group]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [items, query]);

  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0);
    }
  }, [filteredItems.length, activeIndex]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, CommandPaletteItem[]>();
    filteredItems.forEach((item) => {
      const key = item.group ?? 'general';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries());
  }, [filteredItems]);

  const handleSelection = (item: CommandPaletteItem) => {
    if (item.href) {
      router.push(item.href);
    }
    item.action?.();
    onClose();
  };

  const handleKeyNavigation = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = filteredItems[activeIndex];
      if (item) {
        handleSelection(item);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[150] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[160] flex items-start justify-center px-4 py-24 sm:py-32"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 210, damping: 24 }}
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[hsl(var(--color-border)/0.6)] bg-surface shadow-subtle">
              <div className="border-b border-[hsl(var(--color-border)/0.5)] bg-surface-subdued/60 backdrop-blur px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="rounded-md border border-[hsl(var(--color-border)/0.55)] bg-background/70 px-2 py-1 font-medium">Search</span>
                  <span>/</span>
                  <span>Navigate, run commands</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 px-4 py-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyNavigation}
                  placeholder="Jump to a surface or trigger an action"
                  className="w-full rounded-lg border border-transparent bg-surface-subdued/60 px-3 py-2 text-sm text-foreground shadow-inner outline-none focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.6)]"
                />
                <div className="max-h-80 overflow-y-auto pr-1">
                  {groupedItems.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-muted">No matches. Try a different keyword.</p>
                  ) : (
                    groupedItems.map(([group, entries]) => (
                      <div key={group} className="mb-3 last:mb-0">
                        {group !== 'general' ? (
                          <p className="px-2 pb-2 text-xs uppercase tracking-wide text-muted">{group}</p>
                        ) : null}
                        <ul className="flex flex-col">
                          {entries.map((item) => {
                            const index = filteredItems.indexOf(item);
                            const isActive = index === activeIndex;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  className={cn(
                                    'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition',
                                    isActive
                                      ? 'bg-[hsl(var(--color-cyan)/0.15)] text-foreground'
                                      : 'bg-transparent text-muted hover:bg-[hsl(var(--color-cyan)/0.1)] hover:text-foreground',
                                  )}
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onFocus={() => setActiveIndex(index)}
                                  onClick={() => handleSelection(item)}
                                >
                                  <span>
                                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                                    {item.description ? (
                                      <span className="block text-xs text-muted">{item.description}</span>
                                    ) : null}
                                  </span>
                                  {item.href ? (
                                    <span className="text-xs text-muted">↵</span>
                                  ) : (
                                    <span className="text-xs text-muted">⏎</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export type { CommandPaletteItem };
