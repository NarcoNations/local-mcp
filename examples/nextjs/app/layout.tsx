import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Local MCP + Supabase dashboard',
  description: 'Production-ready reference that wires the local MCP knowledge store into Supabase with an API manager smoke test.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
