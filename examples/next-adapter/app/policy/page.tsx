import { latestPolicyDecisions } from '@/examples/next-adapter/lib/policy/checks';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';

export const revalidate = 30;

export default async function PolicyPage() {
  if (!flagEnabled('socialPipeline') && !flagEnabled('mapPipeline')) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12">
        <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-8 text-center text-stone-200">
          <h1 className="text-3xl font-semibold">Ethics Council</h1>
          <p className="mt-2 text-sm text-stone-500">Enable publishing feature flags to activate policy gate logs.</p>
        </section>
      </main>
    );
  }
  const decisions = await latestPolicyDecisions(20);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <header className="space-y-3 text-stone-100">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Ethics Council</p>
        <h1 className="text-4xl font-semibold">Policy Gate Activity</h1>
        <p className="max-w-2xl text-sm text-stone-400">
          Review decisions across publish and social pipelines. Shadow self entries highlight counter-arguments prior to
          approvals.
        </p>
      </header>
      <section className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
        {decisions.length === 0 && <p className="text-sm text-stone-500">No policy decisions recorded yet.</p>}
        <div className="flex flex-col divide-y divide-stone-800">
          {decisions.map((decision) => (
            <article key={decision.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-semibold text-stone-100">Decision {decision.id.slice(0, 8)}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    decision.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {decision.status}
                </span>
              </div>
              <div className="space-y-2">
                {decision.reasons.length > 0 ? (
                  <ul className="list-inside list-disc text-xs text-rose-200">
                    {decision.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-200">All checks passed.</p>
                )}
                {decision.shadow_self && (
                  <p className="text-xs text-stone-400">Shadow self: {decision.shadow_self}</p>
                )}
                <p className="text-xs text-stone-500">{new Date(decision.created_at).toLocaleString()}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
