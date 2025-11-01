import PublishDashboard from '@/examples/next-adapter/app/publish/ui';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export default async function PublishPage() {
  const sb = sbServer();
  const { data } = await sb
    .from('publish_packages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  return <PublishDashboard packages={data ?? []} />;
}
