'use client';

import { useEffect } from 'react';

interface ShortcutsOptions {
  onToggleTheme?: () => void;
  onOpenPalette?: () => void;
  onFocusSearch?: () => void;
}

export function useShortcuts({ onToggleTheme, onOpenPalette, onFocusSearch }: ShortcutsOptions) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const activeTag = (event.target as HTMLElement | null)?.tagName;
      const isEditable = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (event.target as HTMLElement | null)?.isContentEditable;

      if ((event.key === '/' || event.key === 'k') && event.metaKey && isEditable) {
        // let native shortcuts pass through inside inputs
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenPalette?.();
      }

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        if (!isEditable) {
          event.preventDefault();
          onFocusSearch?.();
        }
      }

      if (event.key.toLowerCase() === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!isEditable) {
          onToggleTheme?.();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onFocusSearch, onOpenPalette, onToggleTheme]);
}
