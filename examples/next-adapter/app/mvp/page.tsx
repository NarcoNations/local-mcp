'use client';

import { useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { useToast } from '../../src/components/Toast';
import { generateMvp } from '../../src/lib/dataClient';
import { MvpResult } from '../../src/types/systems';

export default function MvpPage() {
  const toast = useToast();
  const [brief, setBrief] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MvpResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setBrief(text);
      setFileName(file.name);
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Unable to read file', description: 'Ensure brief.json is accessible.' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!brief.trim()) {
      toast.publish({ title: 'Add MVP brief context', description: 'Use the textarea or upload a brief.json file.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = await generateMvp({ brief });
      setResult(payload);
      toast.publish({ title: 'MVP blueprint ready', description: payload.title });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'MVP generator failed', description: 'Try again once the API stabilizes.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="One-shot MVP" toolbar={<span className="text-xs text-muted">Brief → blueprint</span>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
            Mission brief
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Outline mission objectives, constraints, target user, and success criteria."
              rows={8}
              className="rounded-2xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="file" accept="application/json" onChange={handleFile} className="hidden" id="brief-upload" />
              <span
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById('brief-upload')?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    document.getElementById('brief-upload')?.click();
                  }
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 px-3 py-2 text-xs font-semibold text-muted transition hover:text-foreground"
              >
                Upload brief.json
              </span>
              {fileName ? <Pill tone="info">{fileName}</Pill> : null}
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[hsl(var(--color-primary)/0.9)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--color-primary))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Synthesizing…' : 'Generate MVP blueprint'}
            </button>
          </div>
        </form>
      </Surface>
      {result ? (
        <Surface title={result.title} toolbar={<span className="text-xs text-muted">{result.id}</span>}>
          <p className="text-sm text-foreground">{result.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {result.features.map((feature) => (
              <li key={feature} className="rounded-lg border border-[hsl(var(--color-border)/0.35)] bg-surface-subdued/70 px-3 py-2">
                {feature}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}
