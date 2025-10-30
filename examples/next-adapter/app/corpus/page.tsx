'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Surface } from '../../src/components/Surface';
import { Stat } from '../../src/components/Stat';
import { Pill } from '../../src/components/Pill';
import { useToast } from '../../src/components/Toast';
import { getDashboardData, submitCorpusUrl } from '../../src/lib/dataClient';

export default function CorpusPage() {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [conversations, setConversations] = useState<number | null>(null);
  const [messages, setMessages] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getDashboardData();
      setConversations(data.corpus.conversations);
      setMessages(data.corpus.messages);
    })();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      toast.publish({ title: 'Add a ChatGPT export URL', description: 'Paste a download link before submitting.' });
      return;
    }
    if (!url.startsWith('http')) {
      toast.publish({ title: 'URL must include protocol', description: 'Use https:// links for remote archives.' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitCorpusUrl({ url });
      toast.publish({
        title: 'Corpus sync queued',
        description: `Job ${response.id} created. Historian will post ingestion updates.`,
      });
      setUrl('');
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Unable to enqueue', description: 'Check the URL or network then retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Corpus intake" toolbar={<span className="text-xs text-muted">Chat transcripts + message archives</span>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Paste export URL
            <input
              type="url"
              value={url}
              onChange={(event) => {
                const value = event.target.value;
                setUrl(value);
                setSizeWarning(value.includes('.zip') ? 'Large .zip archives may take longer to process.' : null);
              }}
              placeholder="https://…/chat-export.zip"
              className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          {sizeWarning ? <Pill tone="warn">{sizeWarning}</Pill> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              We auto-deduplicate threads, compute embeddings, and sync to <Link href="/search" className="text-[hsl(var(--color-cyan))]">Search</Link>.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[hsl(var(--color-cyan)/0.9)] px-6 py-2 text-sm font-semibold text-foreground transition hover:bg-[hsl(var(--color-cyan))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Enqueuing…' : 'Sync archive'}
            </button>
          </div>
        </form>
      </Surface>
      <Surface title="Corpus at a glance" toolbar={<span className="text-xs text-muted">Updated live</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Conversations" value={conversations ?? '—'} hint="Aggregated across ingest pipelines" />
          <Stat label="Messages" value={messages ?? '—'} hint="Tokenized + vectorized" />
        </div>
      </Surface>
    </div>
  );
}
