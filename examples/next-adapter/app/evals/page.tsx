import { listEvals, listEvalRuns, rankRuns } from '@/examples/next-adapter/lib/evals';
import { flagEnabled } from '@/examples/next-adapter/lib/featureFlags';
import EvalRunner from '@/examples/next-adapter/app/evals/runner';

export const revalidate = 30;

export default async function EvalsPage() {
  if (!flagEnabled('evals')) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
        <section className="rounded-2xl border border-stone-800 bg-stone-900/60 p-8 text-center text-stone-300">
          <h1 className="text-3xl font-semibold text-stone-100">Eval Lab v1</h1>
          <p className="mt-2 text-sm text-stone-500">Enable FF_EVALS to run leaderboard experiments.</p>
        </section>
      </main>
    );
  }
  const evals = await listEvals();
  const runsByEval = await Promise.all(evals.map(async (definition) => ({
    definition,
    runs: rankRuns(await listEvalRuns(definition.id)),
  })));
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3 text-stone-100 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-emerald-300/80">Eval Lab</p>
          <h1 className="text-4xl font-semibold">Model & Prompt Evaluations</h1>
          <p className="max-w-2xl text-sm text-stone-400">
            Compare models against curated datasets. Leaderboard sorts by judge score, with latency and output metrics to guide
            production decisions.
          </p>
        </div>
      </header>
      <EvalRunner evals={evals} />
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {runsByEval.map(({ definition, runs }) => (
          <article
            key={definition.id}
            className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-6 shadow-lg"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-stone-100">{definition.name}</h2>
              <p className="text-xs text-stone-500">Dataset: {definition.dataset_ref}</p>
            </div>
            <div className="flex flex-col gap-3">
              {runs.length === 0 && <p className="text-sm text-stone-500">No runs yet. Trigger one above.</p>}
              {runs.map((run) => (
                <div key={run.id} className="flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-900/70 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-stone-100">{run.model}</span>
                    <span className="rounded-full bg-stone-800/80 px-3 py-1 text-xs uppercase tracking-wide text-stone-300">
                      Score {run.score.toFixed(2)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs text-stone-400 sm:grid-cols-3">
                    <div>
                      <dt className="text-stone-500">BLEU-ish</dt>
                      <dd className="text-stone-200">{run.metrics.bleu_like?.toFixed?.(2) ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Latency</dt>
                      <dd className="text-stone-200">{run.metrics.avg_latency_ms?.toLocaleString?.()} ms</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Tokens out</dt>
                      <dd className="text-stone-200">{run.metrics.avg_tokens_out?.toLocaleString?.()}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-stone-500">Ran {new Date(run.started_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
