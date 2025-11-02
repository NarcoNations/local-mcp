import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/TopNav';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'VibeMixer — NarcoNations control surface',
  description: 'Explore the VibeMixer console for NarcoNations: MCP control room, Supabase sync, research engines, and persona workflows.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <TopNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
