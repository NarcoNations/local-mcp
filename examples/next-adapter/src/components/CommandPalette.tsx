'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type CommandAction = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onSelect?: () => void;
  section?: string;
  shortcut?: string;
};

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandAction[];
}

const overlayTransition = { duration: 0.2, ease: 'easeOut' };

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filteredCommands = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return commands
      .filter((command) => {
        if (!normalizedQuery) return true;
        const haystack = `${command.label} ${command.description ?? ''} ${command.section ?? ''}`;
        return haystack.toLowerCase().includes(normalizedQuery);
      })
      .filter((command) => {
        if (!command.href) return true;
        return command.href !== pathname;
      });
  }, [commands, pathname, query]);

  const groupedCommands = React.useMemo(() => {
    const groups = new Map<string, CommandAction[]>();
    for (const command of filteredCommands) {
      const section = command.section ?? 'Navigation';
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(command);
    }
    return Array.from(groups.entries());
  }, [filteredCommands]);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const flatCommands = groupedCommands.flatMap(([, cmds]) => cmds);

  React.useEffect(() => {
    if (activeIndex >= flatCommands.length) {
      setActiveIndex(flatCommands.length ? flatCommands.length - 1 : 0);
    }
  }, [activeIndex, flatCommands]);

  const handleSelect = React.useCallback(
    (command: CommandAction) => {
      if (command.onSelect) {
        command.onSelect();
      }
      if (command.href) {
        router.push(command.href);
      }
      onClose();
    },
    [onClose, router],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!flatCommands.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatCommands.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + flatCommands.length) % flatCommands.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(flatCommands[activeIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-scrim)] px-3 py-12 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          role="presentation"
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.26, ease: 'easeOut' }}
            className="relative w-full max-w-xl rounded-2xl border border-border bg-surface-elevated shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                placeholder="Search commands, systems, actions..."
                aria-label="Search commands"
              />
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors duration-interactive hover:text-foreground"
                aria-label="Close command palette"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div
              className="max-h-[60vh] overflow-y-auto px-2 py-2"
              role="listbox"
              aria-label="Command results"
            >
              {flatCommands.length === 0 && (
                <div className="rounded-lg border border-border bg-surface-subdued px-4 py-6 text-center text-sm text-muted">
                  Nothing found. Try a different phrase or explore from the dashboard.
                </div>
              )}
              <div className="flex flex-col gap-2">
                {groupedCommands.map(([section, sectionCommands]) => (
                  <div key={section} className="flex flex-col gap-1">
                    <div className="px-3 text-xs font-medium uppercase tracking-wide text-muted opacity-70">{section}</div>
                    {sectionCommands.map((command, index) => {
                      const flatIndex = flatCommands.indexOf(command);
                      const isActive = flatIndex === activeIndex;
                      return (
                        <button
                          key={command.id}
                          type="button"
                          onClick={() => handleSelect(command)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors duration-interactive',
                            isActive
                              ? 'bg-[color:var(--color-accent-soft)] text-foreground'
                              : 'bg-transparent text-foreground',
                          )}
                          role="option"
                          aria-selected={isActive}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{command.label}</span>
                            {command.description && (
                              <span className="text-xs text-muted">{command.description}</span>
                            )}
                          </div>
                          {(command.shortcut || command.section) && (
                            <div className="flex flex-none items-center gap-2 text-xs text-muted">
                              {command.shortcut && (
                                <span className="rounded-md border border-border px-2 py-1 font-semibold text-muted">
                                  {command.shortcut}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
