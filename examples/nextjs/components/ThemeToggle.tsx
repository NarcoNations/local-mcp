'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const label = theme === 'dark' ? 'Switch to daylight' : 'Switch to midnight';
  const icon = theme === 'dark' ? '☀️' : '🌙';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      data-mounted={mounted ? 'true' : 'false'}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="theme-toggle-label">{mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : '—'}</span>
    </button>
  );
}
