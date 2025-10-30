import { useCallback, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "vibeos-theme";

const applyThemeClass = (mode: ThemeMode) => {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(mode === "dark" ? "theme-dark" : "theme-light");
};

export function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof window === "undefined" ? "light" : getPreferredTheme()
  );

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyThemeClass(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = (event: MediaQueryListEvent) => {
      const next = event.matches ? "dark" : "light";
      setTheme(next);
      applyThemeClass(next);
    };

    if (prefersDark.matches) {
      applyThemeClass("dark");
      setTheme("dark");
    } else {
      applyThemeClass("light");
    }

    prefersDark.addEventListener("change", handle);
    return () => prefersDark.removeEventListener("change", handle);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
        applyThemeClass(next);
      }
      return next;
    });
  }, []);

  const setThemeSafely = useCallback((next: ThemeMode) => {
    setTheme(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
        applyThemeClass(next);
      }
      return next;
    });
  }, []);

  return {
    theme,
    setTheme: setThemeSafely,
    toggleTheme,
  };
}

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(() => {
  const storageKey = '${STORAGE_KEY}';
  try {
    const stored = window.localStorage.getItem(storageKey);
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  } catch (error) {
    document.documentElement.classList.add('theme-light');
  }
})();`,
      }}
    />
  );
}
