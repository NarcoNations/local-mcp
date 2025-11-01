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
