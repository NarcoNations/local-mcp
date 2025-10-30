import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { DATASETS } from '@/examples/next-adapter/lib/evals/datasets';
import { EvalClient } from '@/examples/next-adapter/app/evals/EvalClient';

export const revalidate = 0;

export default async function EvalsPage() {
  const sb = sbServer();
  const { data: runs } = await sb
    .from('eval_runs')
    .select('id,model,metrics,started_at,finished_at,eval_id')
    .order('started_at', { ascending: false })
    .limit(10);

  return (
    <main style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Eval Lab</h1>
        <p style={{ color: 'var(--foreground-500,#6b7280)' }}>
          Compare model performance using curated datasets. Results persist to Supabase for auditing.
        </p>
      </header>
      <EvalClient datasets={Object.keys(DATASETS)} />
      <section
        style={{
          border: '1px solid var(--foreground-200,#e5e7eb)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Runs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {(runs ?? []).map((run) => (
            <article
              key={run.id}
              style={{
                border: '1px solid var(--foreground-100,#f3f4f6)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <strong>{run.model}</strong>
              <span>Eval: {run.eval_id}</span>
              <span>Exact: {(run.metrics?.exact ?? 0) * 100}%</span>
              <span>BLEU-ish: {(run.metrics?.bleuish ?? 0) * 100}%</span>
              <span>
                Latency avg:{' '}
                {typeof run.metrics?.avgLatency === 'number'
                  ? `${run.metrics.avgLatency.toFixed(1)} ms`
                  : `${run.metrics?.avgLatency ?? 0} ms`}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-500,#6b7280)' }}>
                {new Date(run.started_at).toLocaleString()} → {new Date(run.finished_at).toLocaleTimeString()}
              </span>
            </article>
          ))}
          {!(runs ?? []).length && <p>No eval runs recorded.</p>}
        </div>
      </section>
    </main>
  );
}
