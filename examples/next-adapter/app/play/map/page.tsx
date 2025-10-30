import MapPlayground from '@/examples/next-adapter/app/play/map/ui';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/featureFlags';

export default async function MapPage() {
  const sb = sbServer();
  const { data: layers } = await sb
    .from('map_layers')
    .select('id, name, type, source_url, status, updated_at')
    .order('updated_at', { ascending: false });
  const { data: tiles } = await sb
    .from('map_tiles')
    .select('id, layer_id, pmtiles_url, built_at')
    .order('built_at', { ascending: false });
  return <MapPlayground layers={layers ?? []} tiles={tiles ?? []} enabled={featureFlags.FF_MAP_PIPELINE} />;
}
