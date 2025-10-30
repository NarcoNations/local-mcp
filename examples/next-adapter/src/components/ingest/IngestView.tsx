'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Loader2, UploadCloud } from 'lucide-react';
import { Card } from '../Card';
import { useToast } from '../Toast';
import { cn } from '../../utils/cn';

export function IngestView() {
  const { push } = useToast();
  const [isDragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [lastSlug, setLastSlug] = React.useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) {
      push({ title: 'No file detected', description: 'Drop a PDF, ZIP, or Markdown bundle to convert.', tone: 'warn' });
      return;
    }
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const response = await fetch('/api/ingest/convert', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }
      const json = await response.json();
      setLastSlug(json.slug);
      push({
        title: 'Ingest conversion complete',
        description: json.slug ? `Slug: ${json.slug}` : 'File converted successfully.',
        tone: 'success',
      });
    } catch (error: any) {
      push({ title: 'Conversion failed', description: error?.message ?? 'Unknown error', tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = event.dataTransfer.files;
    void handleFiles(files);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Ingest conversions"
        description="Drop decks, zips, or transcripts. They funnel through historian + knowledge indexing."
      >
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-surface-subdued px-6 py-12 text-center transition-colors duration-interactive',
            isDragging && 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]',
          )}
        >
          <input type="file" className="hidden" onChange={handleChange} accept=".pdf,.zip,.md,.mdx,.txt,.json" />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated text-accent">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-6 w-6" aria-hidden="true" />}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold text-foreground">Drop files to convert</span>
            <span className="text-sm text-muted">PDF, ZIP, or ChatGPT export — max 150 MB per pass.</span>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {uploading ? 'Uploading…' : 'Drop files or click to browse'}
          </span>
        </label>
        {lastSlug && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-subdued px-4 py-3 text-sm">
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
            <span>
              Stored as <strong>{lastSlug}</strong>.
            </span>
            <Link href="/timeline" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground">
              View in historian
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </Card>
      <div className="flex flex-col gap-4">
        <Card title="Pipeline checklist" description="Make sure ingest is dialed in before you drop heavy payloads." variant="subdued">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Ensure <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">MD_CONVERT_URL</code> is configured.</li>
            <li>Flip <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">INGEST_SUPABASE=true</code> to persist zips.</li>
            <li>Historian auto-logs every conversion; cross-check <Link href="/timeline" className="underline">/timeline</Link>.</li>
          </ul>
        </Card>
        <Card title="Supported formats" variant="subdued">
          <div className="grid gap-2 text-sm text-muted">
            <span>• PDF decks, transcripts, multi-doc ZIPs</span>
            <span>• Markdown knowledge packs and JSON briefs</span>
            <span>• ChatGPT exports via <Link href="/corpus" className="underline">corpus import</Link></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
