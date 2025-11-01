'use client';

import { useMemo, useState } from 'react';

type Layer = {
  id: string;
  name: string;
  type: string;
  source_url: string | null;
  status: string | null;
  updated_at: string | null;
};

type Tile = {
  id: string;
  layer_id: string;
  pmtiles_url: string | null;
  built_at: string | null;
};

interface Props {
  layers: Layer[];
  tiles: Tile[];
  enabled: boolean;
}

export default function MapPlayground({ layers, tiles, enabled }: Props) {
  const [name, setName] = useState('Urban Safety Incidents');
  const [sourceUrl, setSourceUrl] = useState('https://example.com/crime.geojson');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tileLookup = useMemo(() => {
    return tiles.reduce<Record<string, Tile[]>>((acc, tile) => {
      if (!acc[tile.layer_id]) acc[tile.layer_id] = [];
      acc[tile.layer_id].push(tile);
      return acc;
    }, {});
  }, [tiles]);

  async function enqueueBuild() {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/map/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source_url: sourceUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to queue build');
      }
      setStatusMessage('Build job queued. Historian will reflect lifecycle events.');
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <main style={{ padding: '24px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Map Playground</h1>
        <p style={{ color: '#666' }}>Enable FF_MAP_PIPELINE=true to activate PMTiles builds.</p>
      </main>
    );
  }

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Crime Map Pipeline</h1>
        <p style={{ color: '#4a5568' }}>
          Fetch GeoJSON, simplify, and publish PMTiles for NarcoNations atlas. Jobs run via worker orchestrator.
        </p>
      </header>

      <section
        style={{
          border: '1px solid #2d3748',
          borderRadius: 12,
          padding: 16,
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'grid',
          gap: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Layer Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Source GeoJSON URL</span>
          <input
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #1e293b', background: '#111827', color: '#e2e8f0' }}
            placeholder="https://.../data.geojson"
          />
        </label>
        <button
          onClick={enqueueBuild}
          disabled={loading}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#475569' : '#22d3ee',
            color: '#0f172a',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Queueing…' : 'Build Tiles'}
        </button>
        {statusMessage && <span>{statusMessage}</span>}
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Layers</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {layers.map((layer) => (
            <article
              key={layer.id}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: 12,
                padding: 16,
                background: '#f8fafc',
                display: 'grid',
                gap: 6,
              }}
            >
              <strong>{layer.name}</strong>
              <span>Status: {layer.status ?? 'idle'}</span>
              <span>Updated: {layer.updated_at ? new Date(layer.updated_at).toLocaleString() : '—'}</span>
              <span style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>Source: {layer.source_url}</span>
              {tileLookup[layer.id] && (
                <details>
                  <summary style={{ cursor: 'pointer' }}>Tiles ({tileLookup[layer.id].length})</summary>
                  <ul style={{ paddingLeft: 18 }}>
                    {tileLookup[layer.id].map((tile) => (
                      <li key={tile.id}>
                        <a href={tile.pmtiles_url ?? '#'} target="_blank" rel="noreferrer">
                          {tile.pmtiles_url || 'Pending'}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
