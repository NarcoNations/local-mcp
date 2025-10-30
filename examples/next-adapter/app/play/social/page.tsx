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
