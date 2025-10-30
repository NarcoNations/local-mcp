import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { MvpClient } from '@/examples/next-adapter/app/mvp/MvpClient';

export const revalidate = 0;

export default async function Page() {
  const sb = sbServer();
  const { data: briefs } = await sb
    .from('build_briefs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>One‑Shot MVP Generator</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Convert Workroom exports into Build Briefs, generate deliverable bundles, and hand off to publishing/search jobs.
        </p>
      </header>
      <MvpClient briefs={briefs ?? []} />
    </main>
  );
}
