'use client';

import { useState } from 'react';

import type { BuildBrief } from '@/examples/next-adapter/lib/mvp/briefs';

type Props = {
  briefs: BuildBrief[];
};

export default function MvpConsole({ briefs }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate(briefId: string) {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/mvp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
        },
        body: JSON.stringify({ brief_id: briefId }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setStatus(`Generated brief ${briefId}. ZIP: ${data.zip_url ?? 'mock'}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate brief');
    } finally {
      setLoading(false);
    }
  }

  async function enqueue(briefId: string, jobKind: string) {
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/jobs/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
        },
        body: JSON.stringify({ kind: jobKind, payload: { brief_id: briefId } }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setStatus(`Dispatched ${jobKind} for brief ${briefId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
      <div className="grid grid-cols-1 gap-4">
        {briefs.map((brief) => (
          <article key={brief.id} className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/70 p-5 text-sm text-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-semibold text-stone-100">{brief.title}</span>
              <span className="rounded-full bg-stone-800 px-3 py-1 text-xs uppercase tracking-wide text-stone-300">{brief.status}</span>
            </div>
            <p className="text-xs text-stone-400">Owner: {brief.owner}</p>
            <div className="space-y-1 text-xs text-stone-300">
              {brief.acceptance_criteria.map((criterion) => (
                <p key={criterion}>• {criterion}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {brief.lanes?.map?.((lane: any, idx: number) => (
                <span key={idx} className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
                  {lane.lane}: {lane.summary}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-stone-900 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                onClick={() => generate(brief.id)}
                disabled={loading}
              >
                Generate brief ZIP
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                onClick={() => enqueue(brief.id, 'publish:site')}
                disabled={loading}
              >
                Send to publish
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                onClick={() => enqueue(brief.id, 'search-index')}
                disabled={loading}
              >
                Send to index
              </button>
            </div>
            {brief.zip_url && (
              <a href={brief.zip_url} className="text-xs text-emerald-300 hover:text-emerald-200">
                Download latest bundle
              </a>
            )}
          </article>
        ))}
        {briefs.length === 0 && <p className="text-sm text-stone-500">No briefs available.</p>}
      </div>
      {status && <p className="text-xs text-emerald-300">{status}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
