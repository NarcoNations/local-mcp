import SocialConsole from '@/examples/next-adapter/app/play/social/console';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import { mockSocialQueue } from '@/examples/next-adapter/lib/mocks/m3';

export const revalidate = 10;

async function loadQueue() {
  if (!flagEnabled('socialPipeline')) return [];
  if (process.env.USE_MOCKS === 'true') return mockSocialQueue;
  // TODO: fetch from Supabase social_queue table when wired
  return mockSocialQueue;
}

export default async function SocialPlaygroundPage() {
  const enabled = flagEnabled('socialPipeline');
  const queue = await loadQueue();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 text-stone-100 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Signal Studio</p>
          <h1 className="text-4xl font-semibold">Social Publishing Pipeline</h1>
          <p className="max-w-2xl text-sm text-stone-400">
            Render cinematic assets and queue releases. Publishing is stubbed but Historian tracks intents for downstream
            connectors.
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
            enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-400'
          }`}
        >
          {enabled ? 'Pipeline active' : 'FF_SOCIAL_PIPELINE disabled'}
        </span>
      </header>
      <SocialConsole queue={queue} featureFlag={enabled} />
    </main>
  );
}
