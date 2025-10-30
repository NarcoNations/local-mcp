'use client';

import * as React from 'react';
import { Loader2, ServerCog } from 'lucide-react';
import { Card } from '../Card';
import { useToast } from '../Toast';

interface FeedResult {
  type: 'alpha' | 'llm';
  timestamp: string;
  payload: Record<string, unknown>;
}

export function ApiManagerView() {
  const { push } = useToast();
  const [feedResult, setFeedResult] = React.useState<FeedResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleAlphaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const symbol = String(formData.get('symbol') ?? '').trim();
    const fn = String(formData.get('fn') ?? '').trim();
    const payload = String(formData.get('payload') ?? '').trim();
    if (!symbol || !fn) {
      push({ title: 'Symbol + function required', tone: 'warn' });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const json = { symbol, fn, payload: payload || 'default', latency_ms: Math.round(Math.random() * 200 + 120) };
    setFeedResult({ type: 'alpha', timestamp: new Date().toISOString(), payload: json });
    push({ title: 'Alpha probe dispatched', description: `${symbol}.${fn}`, tone: 'info' });
    setLoading(false);
    event.currentTarget.reset();
  };

  const handleLLMSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const task = String(formData.get('task') ?? '').trim();
    const prompt = String(formData.get('prompt') ?? '').trim();
    if (!task || !prompt) {
      push({ title: 'Task + prompt required', tone: 'warn' });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const summary = prompt.slice(0, 96) + (prompt.length > 96 ? '…' : '');
    setFeedResult({ type: 'llm', timestamp: new Date().toISOString(), payload: { task, summary } });
    push({ title: 'LLM probe queued', description: task, tone: 'success' });
    setLoading(false);
    event.currentTarget.reset();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Alpha feed probe" description="Ping the alpha feed symbol + function pair to test a live contract.">
        <form onSubmit={handleAlphaSubmit} className="flex flex-col gap-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Symbol</span>
              <input
                name="symbol"
                placeholder="NARC"
                className="rounded-lg border border-border bg-transparent px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-0"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Function</span>
              <input
                name="fn"
                placeholder="sentiment_delta"
                className="rounded-lg border border-border bg-transparent px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-0"
                autoComplete="off"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Payload (optional)</span>
            <textarea
              name="payload"
              placeholder='{"window":"24h"}'
              className="min-h-[120px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Send probe'}
          </button>
        </form>
      </Card>
      <Card title="LLM probe" description="Fire a structured LLM request against the internal orchestrator.">
        <form onSubmit={handleLLMSubmit} className="flex flex-col gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Task label</span>
            <input
              name="task"
              placeholder="counterintel_summary"
              className="rounded-lg border border-border bg-transparent px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-0"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Prompt</span>
            <textarea
              name="prompt"
              placeholder="Summarize rival syndicate sentiment in under 150 words."
              className="min-h-[140px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Queue prompt'}
          </button>
        </form>
      </Card>
      <Card title="Probe result" description="Last response from the feed or LLM orchestrator." className="lg:col-span-2" variant="subdued">
        {feedResult ? (
          <div className="flex flex-col gap-3 text-sm text-muted">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
              <ServerCog className="h-4 w-4" aria-hidden="true" />
              {feedResult.type} · {new Date(feedResult.timestamp).toLocaleString()}
            </div>
            <pre className="overflow-auto rounded-lg border border-border bg-surface px-3 py-3 text-xs text-foreground">
              {JSON.stringify(feedResult.payload, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted">Fire a probe to see live payloads streamed back.</p>
        )}
      </Card>
    </div>
  );
}
