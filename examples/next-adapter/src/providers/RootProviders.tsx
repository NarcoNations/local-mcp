'use client';

import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '../components/Toast';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
