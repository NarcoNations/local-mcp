'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { useToast } from '../../src/components/Toast';
import { submitIngestConversion } from '../../src/lib/dataClient';

export default function IngestPage() {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).slice(0, 6);
    setFiles(accepted);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      toast.publish({ title: 'Choose files to ingest', description: 'Drop archives or choose from disk to continue.' });
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    try {
      const response = await submitIngestConversion(formData);
      toast.publish({
        title: 'Ingest pipeline queued',
        description: `Conversion job ${response.id} created. Historian is tracking progress.`,
      });
      setFiles([]);
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Upload failed', description: 'Check network conditions and retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface
        title="Ingest pipeline"
        toolbar={<span className="text-xs text-muted">Drag & drop or browse — ZIP, PDF, Markdown</span>}
      >
        <form onSubmit={handleSubmit} className="space-y-6" id="upload">
          <label
            htmlFor="file-input"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
              isDragging
                ? 'border-[hsl(var(--color-cyan))] bg-[hsl(var(--color-cyan)/0.12)]'
                : 'border-[hsl(var(--color-border)/0.5)] bg-surface-subdued/70 hover:border-[hsl(var(--color-cyan)/0.6)]'
            }`}
          >
            <span className="text-3xl" aria-hidden>
              📦
            </span>
            <span className="text-sm font-semibold text-foreground">Drop archives anywhere in this zone</span>
            <span className="text-xs text-muted">We shard to 64MB parts, compress, and route to storage.</span>
            <button
              type="button"
              className="rounded-full border border-[hsl(var(--color-border)/0.4)] bg-background/80 px-4 py-1 text-xs font-semibold text-muted transition hover:text-foreground"
            >
              Browse files
            </button>
            <input
              id="file-input"
              type="file"
              className="hidden"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
          {files.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Queued files</p>
              <ul className="space-y-2 text-sm text-foreground">
                {files.map((file) => (
                  <li key={file.name} className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-background/70 px-3 py-2">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="text-xs font-semibold text-[hsl(var(--color-danger))]"
                onClick={() => setFiles([])}
              >
                Clear list
              </button>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Pill tone="info">Encrypted at rest</Pill>
              <Pill tone="warn">Cold storage flagged</Pill>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--color-primary)/0.9)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--color-primary))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Start conversion'}
            </button>
          </div>
          <p className="text-xs text-muted">
            After conversion, follow the <Link href="/timeline" className="text-[hsl(var(--color-cyan))]">Historian</Link> stream for progress & QA.
          </p>
        </form>
      </Surface>
      <Surface title="Pipeline modes" toolbar={<span className="text-xs text-muted">Narco Noir ingestion</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">Cold storage</h3>
            <p className="mt-2 text-xs text-muted">
              For massive archives + compliance data. We stage to object storage and run distributed conversion workers.
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/60 p-4">
            <h3 className="text-sm font-semibold text-foreground">Hot lane</h3>
            <p className="mt-2 text-xs text-muted">
              Perfect for active drops. Real-time conversion with vectorization + streaming to Historian.
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
