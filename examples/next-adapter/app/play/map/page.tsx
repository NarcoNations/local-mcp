import type { CSSProperties } from 'react';

export default function MapPlayground() {
  return (
    <main style={mainStyle}>
      <section style={cardStyle}>
        <h1 style={{ margin: '0 0 12px 0' }}>Map Playground</h1>
        <p style={leadStyle}>
          Reserved for MapLibre + PMTiles integration. Wire this surface to load offline tiles, overlays, and interactive
          filters once the data feed is finalised.
        </p>
        <div style={mapShellStyle}>
          <div style={mapPlaceholderStyle}>
            <span>Map canvas placeholder — connect MapLibre GL + PMTiles here.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = {
  padding: '24px 0'
};

const cardStyle: CSSProperties = {
  background: 'rgb(255,255,255)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 12px 32px rgba(15,23,42,0.08)',
  display: 'grid',
  gap: '16px'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const mapShellStyle: CSSProperties = {
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px dashed rgba(15,23,42,0.2)',
  padding: '12px',
  background: 'rgba(248,250,252,0.8)'
};

const mapPlaceholderStyle: CSSProperties = {
  minHeight: '360px',
  borderRadius: '12px',
  background: 'rgba(148,163,184,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(15,23,42,0.7)',
  textAlign: 'center',
  padding: '24px'
};
