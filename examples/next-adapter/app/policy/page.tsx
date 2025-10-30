'use client';

import { useEffect, useState } from 'react';
import { featureFlags } from '@/examples/next-adapter/lib/flags';

interface Decision {
  id?: string;
  ts?: string;
  action: string;
  content: string;
  reasons?: string[];
  passed: boolean;
  shadow_self?: string;
}

export default function PolicyPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [rerunContent, setRerunContent] = useState('');
  const [rerunAction, setRerunAction] = useState('publish:site');
  const [result, setResult] = useState<string | null>(null);
  const flags = featureFlags;

  useEffect(() => {
    fetch('/api/policy')
      .then((res) => res.json())
      .then((json) => {
        setDecisions(json.decisions ?? []);
        if (json.note) setNote(json.note);
      })
      .catch(() => setNote('Unable to load policy history.'));
  }, []);

  async function handleRerun() {
    setResult('Running checks…');
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (process.env.NEXT_PUBLIC_DEMO_API_KEY) {
      headers['x-api-key'] = process.env.NEXT_PUBLIC_DEMO_API_KEY;
    }
    const res = await fetch('/api/policy', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: rerunAction, content: rerunContent }),
    });
    const json = await res.json();
    if (res.ok) {
      setResult(json.passed ? 'Pass ✅' : `Blocked ❌ (${(json.reasons ?? []).join(', ')})`);
    } else {
      setResult(json.error ?? 'Failed to run checks');
    }
  }

  return (
    <main className="px-4 py-6 lg:py-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Ethics Council — Policy Gates</h1>
          <p className="text-sm text-neutral-500">
            Automated guardrails and Shadow Self reviews for publish and social actions.
          </p>
          {!flags.socialPipeline() && (
            <span className="text-xs text-neutral-400">
              Enable FF_SOCIAL_PIPELINE to exercise the full policy workflow.
            </span>
          )}
        </header>

        {note && <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">{note}</div>}

        <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-lg font-medium">Manual Re-run</h2>
          <p className="text-sm text-neutral-500">
            Paste content to re-evaluate against current policy rules.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase text-neutral-500">Action Scope</label>
            <select
              value={rerunAction}
              onChange={(event) => setRerunAction(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="publish:site">publish:site</option>
              <option value="social:post">social:post</option>
              <option value="map:build">map:build</option>
            </select>
            <label className="text-xs font-semibold uppercase text-neutral-500">Content</label>
            <textarea
              value={rerunContent}
              onChange={(event) => setRerunContent(event.target.value)}
              className="h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleRerun}
              className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow"
            >
              Run Checks
            </button>
            {result && <p className="text-sm text-neutral-600">{result}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-lg font-medium">Recent Decisions</h2>
          {decisions.length === 0 ? (
            <p className="text-sm text-neutral-500">No policy events yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {decisions.map((decision) => (
                <article
                  key={decision.id ?? `${decision.action}-${decision.ts}`}
                  className="rounded-lg border border-neutral-100 bg-white/80 p-4 shadow-sm"
                >
                  <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{decision.action}</p>
                      <p className="text-sm font-medium text-neutral-800">
                        {decision.passed ? 'Approved' : 'Blocked'}
                      </p>
                    </div>
                    <time className="text-xs text-neutral-500">{decision.ts}</time>
                  </header>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-600">{decision.content}</p>
                  {decision.reasons && decision.reasons.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2 text-xs text-red-600">
                      {decision.reasons.map((reason) => (
                        <li key={reason} className="rounded-full bg-red-50 px-3 py-1">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  {decision.shadow_self && (
                    <p className="mt-3 text-xs text-neutral-500">{decision.shadow_self}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
