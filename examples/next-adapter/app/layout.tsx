import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "../src/components/AppShell";
import { ToastProvider } from "../src/components/Toast";
import { ThemeScript } from "../src/hooks/useTheme";

export const metadata: Metadata = {
  title: "VibeOS Ultimate Dashboard",
  description: "Mission control for ingest, corpus, knowledge, historian, and more.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
