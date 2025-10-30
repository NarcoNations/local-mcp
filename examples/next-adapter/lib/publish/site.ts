import { JobRow } from '@/examples/next-adapter/lib/jobs/types';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { runPolicyChecks, shadowSelfSummary } from '@/examples/next-adapter/lib/policy/checks';

export async function publishSitePackage(job: JobRow) {
  const supabase = sbAdmin();
  const payload = job.payload || {};
  const buildId = payload.build_id || payload.buildId || job.id;
  let content = payload.content_md || '# TODO';
  let assets = payload.assets || [];
  let meta = payload.meta || {};
  if (payload.briefId) {
    const { data: brief } = await supabase.from('build_briefs').select('*').eq('id', payload.briefId).maybeSingle();
    if (brief) {
      content = `# ${brief.title}\n\n${brief.acceptance_criteria}`;
      meta = { ...meta, briefId: brief.id, owner: brief.owner };
    }
  }
  const policy = await runPolicyChecks('publish:site', content, meta);
  if (!policy.passed) {
    throw Object.assign(new Error('Policy check failed'), { status: 403 });
  }
  await shadowSelfSummary('publish:site', content);
  await supabase
    .from('publish_packages')
    .upsert({
      id: buildId,
      job_id: job.id,
      content_md: content,
      assets,
      meta,
      approved: false,
      created_at: new Date().toISOString(),
    });
  await logEvent({
    source: 'publish.site',
    kind: 'publish.package',
    title: `Publish package staged (${buildId})`,
    meta: { jobId: job.id, buildId },
  });
}
