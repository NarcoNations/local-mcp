"use client";

import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/Toast";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
