export default function MapPlayground() {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Map Playground</h1>
        <p style={{ margin: 0, maxWidth: 640, color: 'rgba(0,0,0,0.65)' }}>
          Reserved for MapLibre + PMTiles layers. Use this canvas to experiment with heatmaps, filters, and overlays before we
          wire live tiles.
        </p>
      </header>
      <div
        style={{
          minHeight: '360px',
          borderRadius: '16px',
          border: '2px dashed rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, rgba(240,240,240,0.8), rgba(255,255,255,0.9))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(0,0,0,0.55)',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        Map surface placeholder — initialize MapLibre, attach PMTiles, and wire interactions here.
      </div>
    </div>
  );
}
