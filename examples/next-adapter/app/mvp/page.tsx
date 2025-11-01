import MvpDashboard from '@/examples/next-adapter/app/mvp/ui';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export default async function MvpPage() {
  const sb = sbServer();
  const { data } = await sb
    .from('build_briefs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  return <MvpDashboard briefs={data ?? []} />;
}

const mainStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
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

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '16px'
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

const inputStyle: CSSProperties = {
  borderRadius: '10px',
  border: '1px solid rgba(15,23,42,0.12)',
  padding: '10px',
  background: 'rgba(248,250,252,0.9)'
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

const errorStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(190,18,60,0.9)',
  fontWeight: 600
};
