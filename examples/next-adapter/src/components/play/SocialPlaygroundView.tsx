'use client';

import * as React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card } from '../Card';
import { useToast } from '../Toast';

const templates = [
  { id: 'thumbnail', label: 'Thumbnail', description: 'Hero image + copy for dark social drops.' },
  { id: 'short', label: 'Short', description: 'Vertical script with hook, beats, retention.' },
  { id: 'post', label: 'Post', description: 'Long-form post for encrypted feeds.' },
];

export function SocialPlaygroundView() {
  const { push } = useToast();
  const [template, setTemplate] = React.useState('thumbnail');
  const [context, setContext] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!context.trim()) {
      push({ title: 'Context required', tone: 'warn' });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
    push({ title: 'Queued for forge', description: `${template} ready for the n8n queue`, tone: 'success' });
    setContext('');
  };

  return (
    <Card title="Social forge" description="Prototype thumbnail, short, and post payloads before shipping to n8n.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTemplate(item.id)}
              className={
                template === item.id
                  ? 'rounded-xl border border-border bg-[color:var(--color-accent-soft)] px-4 py-3 text-left text-sm text-foreground'
                  : 'rounded-xl border border-border px-4 py-3 text-left text-sm text-muted transition-colors duration-interactive hover:text-foreground'
              }
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="font-semibold">{item.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{item.description}</p>
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Context</span>
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="What are we dropping? Who needs to feel it?"
            className="min-h-[140px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-[color:var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-transform duration-interactive hover:-translate-y-[1px]"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Enqueue stub'}
        </button>
      </form>
    </Card>
  );
}
