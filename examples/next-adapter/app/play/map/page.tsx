import MapConsole from '@/examples/next-adapter/app/play/map/console';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { mockMapLayers } from '@/examples/next-adapter/lib/mocks/m3';

export const revalidate = 10;

async function loadLayers() {
  if (!flagEnabled('mapPipeline')) return [];
  if (process.env.USE_MOCKS === 'true') return mockMapLayers;
  // TODO: wire to Supabase map_layers once available.
  return mockMapLayers;
}

export default async function MapPlaygroundPage() {
  const enabled = flagEnabled('mapPipeline');
  const layers = await loadLayers();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 text-stone-100 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Cartography Studio</p>
          <h1 className="text-4xl font-semibold">Crime Map Pipeline</h1>
          <p className="max-w-2xl text-sm text-stone-400">
            Convert GeoJSON feeds into PMTiles with provenance tracking. Trigger builds and review last generated tiles.
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
            enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'
          }`}
        >
          {enabled ? 'Pipeline active' : 'FF_MAP_PIPELINE disabled'}
        </span>
      </header>
      <MapConsole layers={layers} featureFlag={enabled} />
    </main>
  );
}
