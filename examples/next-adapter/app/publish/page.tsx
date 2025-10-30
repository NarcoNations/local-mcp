import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { PublishClient } from '@/examples/next-adapter/app/publish/PublishClient';

export const revalidate = 0;

export default async function PublishPage() {
  const sb = sbServer();
  const { data: packages } = await sb
    .from('publish_packages')
    .select('id,content_md,assets,meta,approved,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Publishing Queue</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Packages staged for NarcoNations.com/.org. Approvals trigger downstream deployment via MCP.
        </p>
      </header>
      <PublishClient packages={packages ?? []} />
    </main>
  );
}
