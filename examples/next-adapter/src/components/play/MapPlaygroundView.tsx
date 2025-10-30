'use client';

import { Card } from '../Card';

export function MapPlaygroundView() {
  return (
    <Card title="MapLibre playground" description="MapLibre + PMTiles slot in here once the data stack lands.">
      <div className="flex flex-col gap-3 text-sm text-muted">
        <p>
          Spin up MapLibre layers, PMTiles feeds, and geospatial overlays. Hook the historian timeline to animate drops over
          time.
        </p>
        <p>
          // EDIT HERE: wire to MapLibre client once tiles + credentials are provisioned.
        </p>
      </div>
    </Card>
  );
}
