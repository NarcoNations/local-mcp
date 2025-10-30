"use client";

import { useEffect } from "react";

export interface Shortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  onTrigger: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  if (shortcut.metaKey && !(event.metaKey || event.ctrlKey)) return false;
  if (shortcut.ctrlKey && !event.ctrlKey) return false;
  if (shortcut.shiftKey && !event.shiftKey) return false;
  if (shortcut.altKey && !event.altKey) return false;
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;
  return shortcut.enabled ?? true;
}

export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    if (!Array.isArray(shortcuts) || shortcuts.length === 0) return;

    const handleKeydown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        if (!eventMatchesShortcut(event, shortcut)) return;

        if (shortcut.preventDefault ?? true) {
          event.preventDefault();
        }

        shortcut.onTrigger(event);
      });
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [shortcuts]);
}
