import { JobRow } from '@/examples/next-adapter/lib/jobs/types';
import { logEvent } from '@/examples/next-adapter/lib/historian';
import { buildMapLayer } from '@/examples/next-adapter/lib/map/pipeline';
import { renderSocialAsset } from '@/examples/next-adapter/lib/social/pipeline';
import { publishSitePackage } from '@/examples/next-adapter/lib/publish/site';
import { sbAdmin } from '@/examples/next-adapter/lib/supabase/admin';

async function noop(job: JobRow) {
  await logEvent({ source: 'jobs', kind: 'job.complete', title: `Job ${job.kind} done`, meta: { jobId: job.id } });
}

async function handleConvert(job: JobRow) {
  const supabase = sbAdmin();
  await supabase
    .from('knowledge_ingest')
    .insert({ job_id: job.id, payload: job.payload, created_at: new Date().toISOString() });
  await logEvent({
    source: 'jobs.convert',
    kind: 'convert.complete',
    title: 'Conversion job finished',
    meta: { jobId: job.id, slug: job.payload?.slug },
  });
}

async function handleEmbed(job: JobRow) {
  const supabase = sbAdmin();
  await supabase.from('embeds').insert({ job_id: job.id, payload: job.payload, created_at: new Date().toISOString() });
  await logEvent({
    source: 'jobs.embed',
    kind: 'embed.complete',
    title: 'Embed job finished',
    meta: { jobId: job.id },
  });
}

async function handleSearchIndex(job: JobRow) {
  const supabase = sbAdmin();
  await supabase
    .from('search_index_tasks')
    .insert({ job_id: job.id, payload: job.payload, created_at: new Date().toISOString() });
  await logEvent({
    source: 'jobs.search',
    kind: 'search-index.complete',
    title: 'Search index job finished',
    meta: { jobId: job.id },
  });
}

async function handleSocialRender(job: JobRow) {
  await renderSocialAsset(job);
}

async function handleMapBuild(job: JobRow) {
  await buildMapLayer(job);
}

async function handlePublish(job: JobRow) {
  await publishSitePackage(job);
}

export const JOB_HANDLERS: Record<string, (job: JobRow) => Promise<void>> = {
  convert: handleConvert,
  embed: handleEmbed,
  'search-index': handleSearchIndex,
  'social:render': handleSocialRender,
  'map:build': handleMapBuild,
  'publish:site': handlePublish,
};

export function resolveHandler(kind: string) {
  return JOB_HANDLERS[kind] ?? noop;
}
