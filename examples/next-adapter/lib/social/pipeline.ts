import { JobRow } from '@/examples/next-adapter/lib/jobs/types';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { runPolicyChecks, shadowSelfSummary } from '@/examples/next-adapter/lib/policy/checks';

function ensureQueuePayload(job: JobRow) {
  const payload = job.payload || {};
  const queueId = payload.queue_id || payload.queueId || job.id;
  const template = payload.template || 'default';
  const status = payload.status || 'rendered';
  return { queueId, template, payload, status };
}

export async function renderSocialAsset(job: JobRow) {
  const supabase = sbAdmin();
  const { queueId, template, payload, status } = ensureQueuePayload(job);
  const scheduled_at = payload.scheduled_at || payload.scheduledAt || null;
  await supabase
    .from('social_queue')
    .upsert({
      id: queueId,
      template,
      payload,
      status,
      scheduled_at,
      posted_at: null,
      error: null,
    });

  const assetContent = Buffer.from(JSON.stringify({ template, payload, generated_at: new Date().toISOString() })).toString('base64');
  const url = `data:image/png;base64,${assetContent}`;
  await supabase
    .from('social_assets')
    .upsert({ id: `${queueId}-asset`, queue_id: queueId, url, kind: 'image/png' });

  await logEvent({
    source: 'social.render',
    kind: 'social.render.complete',
    title: `Rendered social asset ${template}`,
    meta: { jobId: job.id, queueId },
  });
}

export async function queueSocialPublish(queueId: string, actor: string) {
  const supabase = sbAdmin();
  const { data } = await supabase.from('social_queue').select('*').eq('id', queueId).maybeSingle();
  if (data) {
    const policy = await runPolicyChecks('social:publish', JSON.stringify(data.payload ?? {}), { queueId });
    if (!policy.passed) {
      throw Object.assign(new Error('Policy check failed'), { status: 403 });
    }
    await shadowSelfSummary('social:publish', JSON.stringify(data.payload ?? {}));
  }
  await supabase
    .from('social_queue')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', queueId);
  await logEvent({
    source: 'social.publish',
    kind: 'social.publish.stub',
    title: `Publish requested for ${queueId}`,
    meta: { queueId, actor },
  });
}
