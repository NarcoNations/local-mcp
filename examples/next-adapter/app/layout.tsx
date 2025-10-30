import './globals.css';
import type { Metadata } from 'next';
import { RootProviders } from '../src/providers/RootProviders';
import { AppShell } from '../src/components/AppShell';

export const metadata: Metadata = {
  title: 'VibeOS Ultimate Dashboard',
  description: 'Narco Noir ↔ VibeLabz Clean — cinematic system control center.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <body>
        <RootProviders>
          <AppShell>{children}</AppShell>
        </RootProviders>
      </body>
    </html>
  );
}
