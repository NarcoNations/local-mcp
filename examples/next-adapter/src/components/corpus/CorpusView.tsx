'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card } from '../Card';
import { Stat } from '../Stat';
import { useToast } from '../Toast';
import type { CorpusSummary } from '../../mocks/corpus';

interface CorpusViewProps {
  summary: CorpusSummary;
}

export function CorpusView({ summary }: CorpusViewProps) {
  const { push } = useToast();
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      push({ title: 'URL required', description: 'Paste a ChatGPT export share link to continue.', tone: 'warn' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/ingest/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url.trim() }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }
      const json = await response.json();
      push({
        title: 'Chat export ingested',
        description: json.slug ? `Stored as ${json.slug}` : 'Historian updated with conversations.',
        tone: 'success',
      });
      setUrl('');
    } catch (error: any) {
      push({ title: 'Ingest failed', description: error?.message ?? 'Unknown error', tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Import ChatGPT conversations"
        description="Paste the export URL. We hydrate the threads, normalize them, and push into the corpus."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-muted" htmlFor="chat-url">
            Chat export URL
          </label>
          <input
            id="chat-url"
            name="fileUrl"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://shareg.pt/..."
            className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-[color:var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-transform duration-interactive hover:-translate-y-[1px]"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Sync export'}
          </button>
        </form>
        <div className="mt-6 rounded-xl border border-border bg-surface-subdued px-4 py-3 text-xs text-muted">
          Heads-up: multi-gig exports should be staged offline. Break them into shards before uploading.
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <Card title="Corpus summary" variant="subdued">
          <div className="flex flex-col gap-4">
            <Stat label="Conversations" value={summary.conversations.toLocaleString()} delta={{ value: '+36 today', tone: 'success', trend: 'up' }} />
            <Stat label="Messages" value={summary.messages.toLocaleString()} delta={{ value: '+412', tone: 'info', trend: 'up' }} />
          </div>
        </Card>
        <Card title="Channels" variant="subdued">
          <div className="flex flex-col gap-2 text-sm text-muted">
            {summary.channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-subdued px-3 py-2">
                <span className="text-foreground">{channel.label}</span>
                <span>{channel.conversations} convos</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Guard rails" variant="subdued">
          <div className="flex flex-col gap-2 text-xs text-muted">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-warn" aria-hidden="true" />
              <span>Strip PII before sharing exports. Historian retains raw transcripts.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-warn" aria-hidden="true" />
              <span>Large exports? Run them through the <Link href="/ingest" className="underline">local converter</Link> to batch zip.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
