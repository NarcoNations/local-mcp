import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/env';
import { PolicyClient } from '@/examples/next-adapter/app/policy/PolicyClient';

export const revalidate = 0;

export default async function PolicyPage() {
  const sb = sbServer();
  const { data: checks } = await sb
    .from('policy_checks')
    .select('id,action,scope,passed,reasons,content_preview')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Ethics Council</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Policy checks intercept publish and social actions. Review outcomes and trigger manual re-runs.
        </p>
        {!featureFlags.socialPipeline && !featureFlags.mapPipeline && (
          <p style={{ fontSize: '0.85rem', color: 'var(--foreground-500,#6b7280)' }}>
            Enable feature flags for automated pipelines to feed the Ethics Council automatically.
          </p>
        )}
      </header>
      <PolicyClient checks={checks ?? []} />
    </main>
  );
}
