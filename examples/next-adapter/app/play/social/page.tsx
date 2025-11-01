import SocialPlayground from '@/examples/next-adapter/app/play/social/ui';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/featureFlags';

export default async function SocialPage() {
  const sb = sbServer();
  const { data: queue } = await sb
    .from('social_queue')
    .select('id, template, status, scheduled_at, posted_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  const { data: assets } = await sb
    .from('social_assets')
    .select('id, queue_id, url, kind')
    .order('created_at', { ascending: false });
  return <SocialPlayground queue={queue ?? []} assets={assets ?? []} enabled={featureFlags.FF_SOCIAL_PIPELINE} />;
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

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.8rem'
};

const leadStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(0,0,0,0.65)',
  lineHeight: 1.6
};

const templateGridStyle: CSSProperties = {
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
};

const templateButtonStyle: CSSProperties = {
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: '14px',
  padding: '16px',
  display: 'grid',
  gap: '6px',
  textAlign: 'left',
  cursor: 'pointer'
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  fontWeight: 600
};

const textareaStyle: CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  padding: '12px',
  background: 'rgba(248,250,252,0.9)',
  resize: 'vertical'
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: '999px',
  border: 'none',
  background: 'rgba(37,99,235,0.85)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer'
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(22,101,52,0.9)',
  fontWeight: 600
};
