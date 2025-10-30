import { useEffect } from "react";

type ShortcutHandler = (event: KeyboardEvent) => boolean | void;

interface ShortcutConfig {
  key: string;
  handler: ShortcutHandler;
  withMeta?: boolean;
  withCtrl?: boolean;
  preventDefault?: boolean;
  allowInInput?: boolean;
}

export function useShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputContext = target
        ? ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable
        : false;

      shortcuts.forEach(({ key, handler, withMeta, withCtrl, preventDefault, allowInInput }) => {
        const matchesKey = event.key.toLowerCase() === key.toLowerCase();
        if (!matchesKey) return;
        if (withMeta && !(event.metaKey || event.ctrlKey)) return;
        if (withCtrl && !event.ctrlKey) return;
        if (!withMeta && event.metaKey && !withCtrl) return;
        if (!withCtrl && event.ctrlKey && !withMeta) return;
        if (!allowInInput && isInputContext) return;

        const shouldPrevent = handler(event);
        if (preventDefault || shouldPrevent) {
          event.preventDefault();
        }
      });
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [shortcuts]);
}
