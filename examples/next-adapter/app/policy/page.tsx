import PolicyBoard from '@/examples/next-adapter/app/policy/ui';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { featureFlags } from '@/examples/next-adapter/lib/featureFlags';

export default async function PolicyPage() {
  const sb = sbServer();
  const { data } = await sb
    .from('policy_gate_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  return <PolicyBoard logs={data ?? []} enabled={featureFlags.FF_SOCIAL_PIPELINE || featureFlags.FF_MAP_PIPELINE || featureFlags.FF_JOBS_WORKER} />;
}
