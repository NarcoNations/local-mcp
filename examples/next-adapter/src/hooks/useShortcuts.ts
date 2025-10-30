'use client';

import * as React from 'react';

type ShortcutCombo = string;

type ShortcutOptions = {
  combo: ShortcutCombo;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  allowInInputs?: boolean;
};

function parseCombo(combo: ShortcutCombo) {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  const key = parts.pop() ?? '';
  const modifiers = new Set(parts.map((part) => {
    if (part === 'cmd') return 'meta';
    if (part === 'command') return 'meta';
    if (part === 'mod') return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? 'meta' : 'ctrl';
    if (part === 'control') return 'ctrl';
    return part;
  }));

  return { key, modifiers };
}

export function useShortcuts(shortcuts: ShortcutOptions[]) {
  React.useEffect(() => {
    const parsed = shortcuts.map((shortcut) => ({
      ...shortcut,
      parsed: parseCombo(shortcut.combo),
    }));

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable = target?.isContentEditable;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      for (const shortcut of parsed) {
        if (!shortcut.allowInInputs && (isInput || isEditable)) {
          continue;
        }

        const { key, modifiers } = shortcut.parsed;
        const pressedKey = event.key.toLowerCase();
        const requiresShift = modifiers.has('shift');
        const requiresAlt = modifiers.has('alt');
        const requiresMeta = modifiers.has('meta');
        const requiresCtrl = modifiers.has('ctrl');

        const matchKey = key === pressedKey || (key === 'escape' && event.key === 'Escape');
        if (!matchKey) continue;

        if (event.shiftKey !== requiresShift) continue;
        if (event.altKey !== requiresAlt) continue;
        if (event.metaKey !== requiresMeta) continue;
        if (event.ctrlKey !== requiresCtrl) continue;

        if (shortcut.preventDefault) {
          event.preventDefault();
        }

        shortcut.handler(event);
        break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
