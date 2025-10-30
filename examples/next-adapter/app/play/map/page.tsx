import { Card } from "../../../src/components/Card";
import { Toolbar } from "../../../src/components/Toolbar";

export default function MapPlaygroundPage() {
  return (
    <div className="space-y-6">
      <Toolbar
        title="Map playground"
        description="Spin up MapLibre layers and mock spatial overlays."
        actions={<span className="text-xs text-muted">Wire MapLibre GL once adapters are ready.</span>}
      />
      <Card variant="elevated">
        <div className="flex h-[420px] items-center justify-center rounded-3xl border border-border bg-surface text-sm text-muted">
          MapLibre surface placeholder — plug your PMTiles endpoint here.
        </div>
      </Card>
    </div>
  );
}
