'use client';

import { useState, useTransition } from 'react';

const API_HEADERS = process.env.NEXT_PUBLIC_DEMO_API_KEY
  ? { 'x-api-key': process.env.NEXT_PUBLIC_DEMO_API_KEY }
  : undefined;

export function MapClient({ layers }: { layers: any[] }) {
  const [sourceUrl, setSourceUrl] = useState('https://example.com/crime.geojson');
  const [selectedLayer, setSelectedLayer] = useState(layers[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();

  const build = () => {
    startTransition(async () => {
      await fetch('/api/map/build', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(API_HEADERS ?? {}),
        },
        body: JSON.stringify({ layer_id: selectedLayer || undefined, sourceUrl }),
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section
        style={{
          border: '1px solid var(--foreground-200,#e5e7eb)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Build Tiles</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Layer</span>
          <select value={selectedLayer} onChange={(e) => setSelectedLayer(e.target.value)} style={{ padding: '8px 10px' }}>
            <option value="">Create new layer</option>
            {layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name || layer.id}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Source URL</span>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--foreground-200,#e5e7eb)' }}
          />
        </label>
        <button
          type="button"
          onClick={build}
          disabled={isPending}
          style={{
            padding: '10px 14px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--accent-600,#0ea5e9)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Queuing…' : 'Queue build job'}
        </button>
      </section>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        {layers.map((layer) => (
          <article
            key={layer.id}
            style={{
              border: '1px solid var(--foreground-100,#f3f4f6)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <strong>{layer.name || layer.id}</strong>
            <span>Status: {layer.status}</span>
            <span>Source: {layer.source_url || '—'}</span>
            <span>Updated: {layer.updated_at ? new Date(layer.updated_at).toLocaleString() : 'never'}</span>
          </article>
        ))}
        {!layers.length && <p>No layers yet.</p>}
      </section>
    </div>
  );
}
