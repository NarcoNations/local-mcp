'use client';

import { useState } from 'react';

import type { PublishPackage } from '@/examples/next-adapter/lib/mcp/publish';

type Props = {
  packages: PublishPackage[];
};

export default function PublishBoard({ packages }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setStatus(null);
    setError(null);
    try {
      const res = await fetch(`/api/publish/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_DEMO_KEY || 'demo-key',
        },
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setStatus(`Package ${id} approved. Refresh to view updated status.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to approve package');
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/70 p-6">
      <div className="grid grid-cols-1 gap-4">
        {packages.map((pkg) => (
          <article key={pkg.id} className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/70 p-5 text-sm text-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-semibold text-stone-100">{pkg.title}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                  pkg.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : pkg.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {pkg.status}
              </span>
            </div>
            <p className="text-xs text-stone-400">Created {new Date(pkg.created_at).toLocaleString()}</p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-stone-950/70 p-3 text-xs text-stone-300">
{pkg.content_md}
            </pre>
            <div className="flex flex-wrap items-center gap-2">
              {pkg.assets?.map((asset) => (
                <a
                  key={asset.url}
                  href={asset.url}
                  className="rounded-full border border-stone-700 px-3 py-1 text-xs text-emerald-300 hover:border-emerald-400 hover:text-emerald-200"
                >
                  {asset.name || asset.url}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-stone-900 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
                onClick={() => approve(pkg.id)}
                disabled={pkg.status === 'approved'}
              >
                Approve
              </button>
              {pkg.link && (
                <a href={pkg.link} className="text-xs text-emerald-300 hover:text-emerald-200">
                  Download package
                </a>
              )}
            </div>
          </article>
        ))}
        {packages.length === 0 && <p className="text-sm text-stone-500">No packages staged.</p>}
      </div>
      {status && <p className="text-xs text-emerald-300">{status}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
