export interface MetricTileProps {
  label: string;
  value: string;
  meta?: string;
}

export function MetricTile({ label, value, meta }: MetricTileProps) {
  return (
    <div className="metric-tile">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {meta && <span className="metric-meta">{meta}</span>}
    </div>
  );
}
