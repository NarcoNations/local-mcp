'use client';

import { Surface } from '../../../src/components/Surface';

export default function MapPlaygroundPage() {
  return (
    <Surface
      title="Map playground"
      toolbar={<span className="text-xs text-muted">MapLibre placeholder — wire in tiles when ready</span>}
    >
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 p-6 text-center">
        <span className="text-3xl" aria-hidden>
          🗺️
        </span>
        <p className="text-sm text-muted">
          MapLibre layers will render here. Connect the ingest geo JSON feed to visualize mission footprints.
        </p>
        <p className="text-xs text-muted">// EDIT HERE to provide MapLibre access token + style.</p>
      </div>
    </Surface>
  );
}
