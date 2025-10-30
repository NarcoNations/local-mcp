import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { JobRow } from '@/examples/next-adapter/lib/jobs/types';

export async function enqueueJob(kind: string, payload: Record<string, any> = {}) {
  const supabase = sbAdmin();
  const { data, error } = await supabase
    .from('jobs')
    .insert({ kind, status: 'queued', payload, created_at: new Date().toISOString() })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as JobRow;
}

export async function takeNextJob(): Promise<JobRow | null> {
  const supabase = sbAdmin();
  const { data: queued, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  if (!queued?.length) return null;
  const job = queued[0] as JobRow;
  const { data, error: updateError } = await supabase
    .from('jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;
  return data as JobRow;
}

export async function markJobDone(jobId: string, _meta: Record<string, any> = {}) {
  const supabase = sbAdmin();
  await supabase
    .from('jobs')
    .update({ status: 'done', finished_at: new Date().toISOString() })
    .eq('id', jobId);
}

export async function markJobError(jobId: string, error: any) {
  const supabase = sbAdmin();
  await supabase
    .from('jobs')
    .update({
      status: 'error',
      finished_at: new Date().toISOString(),
      error: typeof error === 'string' ? error : error?.message || 'Unknown error',
    })
    .eq('id', jobId);
}
