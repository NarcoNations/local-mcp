"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { commandActions, type CommandAction } from "@/data/navigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/utils/cn";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: CommandAction[];
  onAction?: (action: CommandAction) => void;
}

const paletteVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.45 },
  exit: { opacity: 0 },
};

export function CommandPalette({ open, onOpenChange, actions, onAction }: CommandPaletteProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const mergedActions = useMemo(() => {
    const base = actions ?? commandActions;
    if (!query.trim()) {
      return base;
    }
    const q = query.trim().toLowerCase();
    return base.filter((action) => {
      const haystack = `${action.label} ${action.hint ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [actions, query]);

  const grouped = useMemo(() => {
    return mergedActions.reduce((groups, action) => {
      const group = action.group ?? "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(action);
      return groups;
    }, {} as Record<string, CommandAction[]>);
  }, [mergedActions]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const keys = useMemo(() => Object.keys(grouped), [grouped]);
  const flattened = useMemo(() => keys.flatMap((key) => grouped[key]), [grouped, keys]);
  const activeAction = flattened[activeIndex];

  useEffect(() => {
    if (activeIndex >= flattened.length) {
      setActiveIndex(flattened.length > 0 ? flattened.length - 1 : 0);
    }
  }, [activeIndex, flattened.length]);

  const handleSelect = (action: CommandAction) => {
    onAction?.(action);
    onOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(flattened.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + Math.max(flattened.length, 1)) % Math.max(flattened.length, 1));
    } else if (event.key === "Enter" && activeAction) {
      event.preventDefault();
      handleSelect(activeAction);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
            aria-hidden
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            className="fixed left-1/2 top-[12%] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-border/60 bg-surface shadow-lg"
            variants={paletteVariants}
            initial={reducedMotion ? false : "initial"}
            animate={reducedMotion ? { opacity: 1 } : "animate"}
            exit={reducedMotion ? { opacity: 0 } : "exit"}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Command className="h-4 w-4 text-highlight" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search systems, actions, or prompts"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                aria-label="Search commands"
              />
              <span className="hidden items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-xs font-medium text-muted/80 sm:inline-flex">
                <span className="font-semibold">Esc</span>
                <span>close</span>
              </span>
            </div>
            <div
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto px-2 py-3"
              onKeyDown={handleKeyDown}
            >
              {flattened.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">No matches. Try another phrase.</p>
              ) : (
                keys.map((group) => (
                  <div key={group} className="mb-4 last:mb-0">
                    <div className="px-3 pb-1 text-xs uppercase tracking-wide text-muted/80">{group}</div>
                    <div className="space-y-1">
                      {grouped[group].map((action) => {
                        const globalIndex = flattened.indexOf(action);
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            data-index={globalIndex}
                            onClick={() => handleSelect(action)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                              globalIndex === activeIndex
                                ? "bg-highlight/10 text-highlight"
                                : "hover:bg-surface-muted/80",
                            )}
                          >
                            {Icon && <Icon className="h-4 w-4" aria-hidden />}
                            <span className="flex-1 text-foreground/95">{action.label}</span>
                            {action.hint && <span className="text-xs text-muted">{action.hint}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
