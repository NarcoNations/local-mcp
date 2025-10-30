export default function MapPlayground() {
  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Map Playground</h1>
        <p style={{ maxWidth: 720, lineHeight: 1.5 }}>
          Placeholder for MapLibre + PMTiles integration. Drop in tilesets, styling controls, and geospatial overlays once the
          map service is wired.
        </p>
      </header>
      <section
        aria-label="Map preview"
        style={{
          borderRadius: 18,
          border: '1px dashed rgba(0,0,0,0.2)',
          minHeight: 360,
          background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 20px, transparent 20px, transparent 40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p style={{ opacity: 0.6 }}>Map surface coming soon — hook MapLibre GL to PMTiles once API keys are provisioned.</p>
      </section>
    </main>
  );
}
