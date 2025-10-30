"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { cn } from "../utils/cn";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  shortcut?: string;
  onSelect?: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  items: CommandPaletteItem[];
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lowered = query.toLowerCase();
    return items.filter((item) =>
      item.label.toLowerCase().includes(lowered) ||
      (item.description?.toLowerCase().includes(lowered) ?? false)
    );
  }, [items, query]);

  const handleSelect = (item: CommandPaletteItem) => {
    if (item.href) {
      router.push(item.href);
    }
    item.onSelect?.();
    onOpenChange(false);
  };

  const variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : fadeInUp;

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[color:rgba(0,0,0,0.45)] px-4 py-16 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
            className="w-full max-w-xl rounded-2xl border border-border-strong bg-surface-elevated shadow-pop"
          >
            <div className="border-b border-border px-4 pb-3 pt-4">
              <label className="flex items-center gap-3 text-sm text-muted">
                <span className="sr-only">Search actions</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search destinations or actions"
                  className="w-full bg-transparent text-base text-primary outline-none placeholder:text-[color:rgba(148,163,184,0.8)]"
                />
                <kbd className="rounded-md border border-border px-2 py-1 text-xs text-muted">
                  ESC
                </kbd>
              </label>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
              {filteredItems.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No matches. Try another keyword.
                </li>
              ) : (
                filteredItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "focus-ring flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition",
                        "hover:bg-accent-soft hover:text-primary"
                      )}
                    >
                      <span className="text-sm font-medium text-primary">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="text-xs text-muted">
                          {item.description}
                        </span>
                      ) : null}
                      {item.shortcut ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                          {item.shortcut}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
