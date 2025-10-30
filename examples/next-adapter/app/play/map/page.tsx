import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/env';
import { MapClient } from '@/examples/next-adapter/app/play/map/MapClient';

export const revalidate = 0;

export default async function Page() {
  const sb = sbServer();
  const { data: layers } = await sb
    .from('map_layers')
    .select('id,name,status,source_url,updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);
  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Map Playground</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Build PMTiles layers for the Crime Map. Jobs fan out via the worker and log to Historian.
        </p>
        {!featureFlags.mapPipeline && (
          <p style={{ fontSize: '0.9rem', color: 'var(--warning-600,#b45309)' }}>
            Feature flag <code>FF_MAP_PIPELINE</code> is disabled — queue requests will be paused.
          </p>
        )}
      </header>
      <MapClient layers={layers ?? []} />
    </main>
  );
}
