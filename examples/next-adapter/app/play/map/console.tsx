'use client';

import { useState } from 'react';

import type { mockMapLayers } from '@/examples/next-adapter/lib/mocks/m3';

type Layer = (typeof mockMapLayers)[number];

type Props = {
  layers: Layer[];
  featureFlag: boolean;
};

export default function MapConsole({ layers, featureFlag }: Props) {
  const [sourceUrl, setSourceUrl] = useState('https://example.com/crime.geojson');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function triggerBuild() {
    setIsSubmitting(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/jobs/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
        },
        body: JSON.stringify({ kind: 'map:build', payload: { source_url: sourceUrl } }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setStatus(`Job ${data.job?.id ?? 'queued'} dispatched.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch build');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <form className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-100">Build tiles</h2>
            <p className="text-xs text-stone-500">Fetch GeoJSON → simplify → export PMTiles. Provide S3 or local URL.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-stone-300">Source URL</span>
            <input
              className="rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={!featureFlag}
              placeholder="https://.../map.geojson"
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
            onClick={triggerBuild}
            disabled={!featureFlag || isSubmitting}
          >
            {isSubmitting ? 'Dispatching…' : 'Build tiles'}
          </button>
          {status && <p className="text-xs text-emerald-300">{status}</p>}
          {error && <p className="text-xs text-rose-300">{error}</p>}
          {!featureFlag && <p className="text-xs text-stone-500">Enable FF_MAP_PIPELINE to activate builds.</p>}
        </form>
        <div className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <h2 className="text-lg font-semibold text-stone-100">Layers</h2>
          <div className="flex flex-col gap-3 overflow-y-auto">
            {layers.map((layer) => (
              <article key={layer.id} className="flex flex-col gap-2 rounded-lg border border-stone-800 bg-stone-900/80 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-stone-100">{layer.name}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                      layer.status === 'ready'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : layer.status === 'building'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {layer.status}
                  </span>
                </div>
                <p className="text-xs text-stone-400">Source: {layer.source_url}</p>
                <p className="text-xs text-stone-500">Updated {new Date(layer.updated_at).toLocaleString()}</p>
                <div className="space-y-2">
                  {layer.tiles?.map((tile) => (
                    <div key={tile.id} className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-stone-400">
                      <p className="text-stone-200">PMTiles: {tile.pmtiles_url}</p>
                      <p>Built {new Date(tile.built_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {layers.length === 0 && <p className="text-sm text-stone-500">No layers tracked yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
