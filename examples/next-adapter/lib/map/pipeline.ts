import { JobRow } from '@/examples/next-adapter/lib/jobs/types';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { runtimeFlags } from '@/examples/next-adapter/lib/env';

function flattenCoords(coords: any, acc: number[] = []) {
  if (Array.isArray(coords[0])) {
    for (const part of coords) flattenCoords(part, acc);
    return acc;
  }
  acc.push(coords[0], coords[1]);
  return acc;
}

function bboxForGeojson(featureCollection: any) {
  if (!featureCollection) return null;
  const coords: number[] = [];
  const features = featureCollection.features || [];
  for (const feature of features) {
    if (!feature?.geometry) continue;
    flattenCoords(feature.geometry.coordinates, coords);
  }
  if (!coords.length) return null;
  const xs = coords.filter((_, idx) => idx % 2 === 0);
  const ys = coords.filter((_, idx) => idx % 2 === 1);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export async function buildMapLayer(job: JobRow) {
  const supabase = sbAdmin();
  const payload = job.payload || {};
  const sourceUrl: string | undefined = payload.sourceUrl || payload.source_url;
  const layerId = payload.layer_id || payload.layerId || job.id;
  const layerName = payload.layer_name || payload.layerName || `Layer ${job.id}`;

  let featureCollection: any = payload.geojson || payload.featureCollection;
  if (!featureCollection && sourceUrl && !runtimeFlags.useMocks) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to fetch GeoJSON (${res.status})`);
    featureCollection = await res.json();
  }
  if (!featureCollection) {
    featureCollection = {
      type: 'FeatureCollection',
      features: payload.features || [],
    };
  }

  const bbox = bboxForGeojson(featureCollection);
  const now = new Date().toISOString();

  const layerRes = await supabase
    .from('map_layers')
    .upsert({
      id: layerId,
      name: layerName,
      type: payload.type || 'vector',
      source_url: sourceUrl || null,
      updated_at: now,
      status: 'built',
    });
  if (layerRes.error) throw layerRes.error;

  const tileRes = await supabase
    .from('map_tiles')
    .upsert({
      layer_id: layerId,
      pmtiles_url: payload.pmtilesUrl || payload.pmtiles_url || `pmtiles://${layerId}`,
      built_at: now,
      meta: {
        bbox,
        featureCount: featureCollection.features?.length ?? 0,
        // EDIT HERE: adjust tiling params or simplification thresholds
      },
    }, { onConflict: 'layer_id' });
  if (tileRes.error) throw tileRes.error;

  if (Array.isArray(featureCollection.features) && featureCollection.features.length) {
    const rows = featureCollection.features.slice(0, 200).map((feature: any, idx: number) => ({
      id: `${layerId}-${idx}`,
      layer_id: layerId,
      feature,
      bbox,
      updated_at: now,
    }));
    const featureRes = await supabase.from('map_features').upsert(rows, { onConflict: 'id' });
    if (featureRes.error) throw featureRes.error;
  }

  await logEvent({
    source: 'map.pipeline',
    kind: 'map.build.complete',
    title: `Built map layer ${layerName}`,
    meta: { jobId: job.id, layerId, featureCount: featureCollection.features?.length ?? 0 },
  });
}
