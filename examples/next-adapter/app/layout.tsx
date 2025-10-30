import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '../src/components/AppShell';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'VibeOS Ultimate Dashboard',
  description: 'Narco Noir meets VibeLabz Clean — unified system command center.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
