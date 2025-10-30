'use client';

import { useState } from 'react';

const layers = ['Opportunity Zones', 'Trade Routes', 'Community Hubs'];

export default function MapPlayground() {
  const [selectedLayer, setSelectedLayer] = useState(layers[0]);
  const [notes, setNotes] = useState('Highlight upload hotspots for the historian timeline.');

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Map Playground</h1>
        <p style={{ color: 'rgb(85, 85, 85)', maxWidth: 720 }}>
          Prototype MapLibre + PMTiles experiences. This stub reserves a responsive canvas and captures layer notes so you can
          hand off requirements while tiling is configured.
        </p>
      </header>
      <section
        style={{
          border: '1px solid rgb(229, 229, 229)',
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 360,
          background: 'linear-gradient(135deg, rgb(245, 245, 245), rgb(223, 231, 255))'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgb(51, 51, 68)',
            fontSize: 18,
            fontWeight: 600
          }}
        >
          Map canvas placeholder — wire MapLibre GL here
        </div>
      </section>
      <section
        style={{
          display: 'grid',
          gap: 16,
          border: '1px solid rgb(229, 229, 229)',
          borderRadius: 16,
          padding: '20px 24px'
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Layer focus</span>
          <select
            value={selectedLayer}
            onChange={(event) => setSelectedLayer(event.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(215, 215, 215)' }}
          >
            {layers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Design notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgb(215, 215, 215)', fontFamily: 'inherit' }}
          />
        </label>
        <p style={{ fontSize: 13, color: 'rgb(119, 119, 119)' }}>
          TODO: load PMTiles, add draw controls, and expose dataset toggles for {selectedLayer}.
        </p>
      </section>
    </main>
  );
}
