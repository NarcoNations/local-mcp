"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { Stat } from "../Stat";
import { useToast } from "../Toast";
import type { CorpusStats } from "../../types/app";

interface CorpusViewProps {
  stats: CorpusStats;
}

export function CorpusView({ stats }: CorpusViewProps) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const { push } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ingest/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url.trim() }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const result = await response.json();
      push({
        title: "Chat export queued",
        description: `${result.count ?? 0} messages streaming into corpus.`,
        variant: "success",
      });
      setUrl("");
    } catch (error) {
      push({
        title: "Ingest failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Corpus intake"
        description="Sync conversation intelligence from ChatGPT exports or drop-ins."
        actions={<span className="text-xs text-muted">Focus on exports under 50MB for speedy transforms.</span>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat
          label="Conversations"
          value={stats.conversations.toLocaleString()}
          helper="Active dialogue threads"
          delta={{ value: "+4 today", trend: "up" }}
        />
        <Stat
          label="Messages"
          value={stats.messages.toLocaleString()}
          helper="Total utterances"
          delta={{ value: "+182", trend: "up" }}
        />
        <Stat
          label="Sources"
          value={(stats.sources ?? 0).toLocaleString()}
          helper="Feeds linked"
          delta={{ value: "Stable", trend: "flat" }}
        />
      </div>
      <Card
        title="ChatGPT export"
        description="Paste a secure export URL. We fetch, sanitize, and ingest directly into the corpus."
        variant="elevated"
      >
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-xs uppercase tracking-[0.2em] text-muted" htmlFor="export-url">
            Export URL
          </label>
          <input
            id="export-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://chat.openai.com/api/export?token=..."
            className="focus-ring w-full rounded-2xl border border-border bg-surface-elevated px-4 py-2 text-sm text-primary placeholder:text-muted"
            required
            type="url"
          />
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-muted">
            <p className="font-semibold text-primary">Guard rails</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Keep exports under 50MB. Split large transcripts into segments.</li>
              <li>Ensure the URL is accessible for the next 10 minutes.</li>
              <li>We automatically scrub sensitive metadata before storage.</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
            >
              {loading ? "Fetching export..." : "Ingest export"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
