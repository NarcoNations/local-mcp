import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/env';
import { SocialClient } from '@/examples/next-adapter/app/play/social/SocialClient';

export const revalidate = 0;

export default async function Page() {
  const sb = sbServer();
  const { data: queue } = await sb
    .from('social_queue')
    .select('id,template,status,scheduled_at,posted_at')
    .order('created_at', { ascending: false })
    .limit(20);
  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Social Playground</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Render shareable assets and stage publishes. Historian tracks every render and approval.
        </p>
        {!featureFlags.socialPipeline && (
          <p style={{ fontSize: '0.9rem', color: 'var(--warning-600,#b45309)' }}>
            Feature flag <code>FF_SOCIAL_PIPELINE</code> is disabled — rendering runs in dry mode.
          </p>
        )}
      </header>
      <SocialClient queue={queue ?? []} />
    </main>
  );
}
