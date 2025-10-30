'use client';

import { useState } from 'react';

import type { mockSocialQueue } from '@/examples/next-adapter/lib/mocks/m3';

type QueueEntry = (typeof mockSocialQueue)[number];

type Props = {
  queue: QueueEntry[];
  featureFlag: boolean;
};

const defaultTemplate = 'weekly-brief';

export default function SocialConsole({ queue, featureFlag }: Props) {
  const [template, setTemplate] = useState(defaultTemplate);
  const [headline, setHeadline] = useState('Narco Atlas weekly signal');
  const [cta, setCta] = useState('Tap for the full brief');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function callEndpoint(path: string, payload: Record<string, any>) {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  }

  async function handleRender() {
    if (!featureFlag) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      await callEndpoint('/api/social/render', {
        template,
        payload: { headline, call_to_action: cta },
      });
      setStatus('Render job queued. Refresh to see assets.');
    } catch (err: any) {
      setError(err?.message || 'Failed to render asset');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!featureFlag) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      await callEndpoint('/api/social/publish', {
        template,
        payload: { headline, call_to_action: cta },
      });
      setStatus('Publish stub executed. Check Historian timeline.');
    } catch (err: any) {
      setError(err?.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <form className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-stone-100">Template</h2>
            <p className="text-xs text-stone-500">HTML → PNG pipeline with cinematic defaults.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-stone-300">Template key</span>
            <input
              className="rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={!featureFlag}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-stone-300">Headline</span>
            <input
              className="rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              disabled={!featureFlag}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-stone-300">Call to action</span>
            <input
              className="rounded-lg border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-100 focus:border-emerald-500 focus:outline-none"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              disabled={!featureFlag}
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
              onClick={handleRender}
              disabled={!featureFlag || loading}
            >
              {loading ? 'Working…' : 'Render asset'}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-stone-700 px-5 py-2 text-sm font-semibold text-stone-200 transition hover:border-emerald-400 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:border-stone-700 disabled:text-stone-500"
              onClick={handlePublish}
              disabled={!featureFlag || loading}
            >
              Stub publish
            </button>
          </div>
          {status && <p className="text-xs text-emerald-300">{status}</p>}
          {error && <p className="text-xs text-rose-300">{error}</p>}
          {!featureFlag && <p className="text-xs text-stone-500">Enable FF_SOCIAL_PIPELINE to activate rendering.</p>}
        </form>
        <div className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <h2 className="text-lg font-semibold text-stone-100">Queue</h2>
          <div className="flex flex-col gap-3">
            {queue.map((item) => (
              <article key={item.id} className="flex flex-col gap-2 rounded-lg border border-stone-800 bg-stone-900/80 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-stone-100">{item.template}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                      item.status === 'posted'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.status === 'scheduled'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-stone-400">Headline: {item.payload.headline}</p>
                <p className="text-xs text-stone-400">CTA: {item.payload.call_to_action}</p>
                <p className="text-xs text-stone-500">Scheduled {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '—'}</p>
                <div className="space-y-1">
                  {item.assets?.map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.url}
                      className="block rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-400 hover:text-emerald-200"
                    >
                      {asset.kind} asset →
                    </a>
                  ))}
                </div>
              </article>
            ))}
            {queue.length === 0 && <p className="text-sm text-stone-500">No queued posts.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
