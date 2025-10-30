'use client';

import { useState } from 'react';
import { Surface } from '../../../src/components/Surface';
import { useToast } from '../../../src/components/Toast';
import { enqueueSocialJob } from '../../../src/lib/dataClient';

const templates = [
  { id: 'thumbnail', label: 'Thumbnail', description: 'Generate cover art + copy for drops.' },
  { id: 'short', label: 'Short', description: 'Script 30-60 sec short narrative.' },
  { id: 'post', label: 'Post', description: 'Compose multi-channel social post set.' },
];

export default function SocialPlaygroundPage() {
  const toast = useToast();
  const [template, setTemplate] = useState('thumbnail');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim()) {
      toast.publish({ title: 'Add a topic or drop name', description: 'We need a signal to craft narratives.' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await enqueueSocialJob({ template, topic });
      toast.publish({ title: 'Social narrative queued', description: `Status: ${response.status}` });
      setTopic('');
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Unable to enqueue', description: 'Check narrative worker status.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Surface title="Social playground" toolbar={<span className="text-xs text-muted">Narrative templates</span>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-3 transition ${
                template === item.id
                  ? 'border-[hsl(var(--color-cyan))] bg-[hsl(var(--color-cyan)/0.15)] text-foreground'
                  : 'border-[hsl(var(--color-border)/0.45)] bg-surface-subdued/70 text-muted hover:border-[hsl(var(--color-cyan)/0.55)]'
              }`}
            >
              <input
                type="radio"
                name="template"
                value={item.id}
                checked={template === item.id}
                onChange={() => setTemplate(item.id)}
                className="hidden"
              />
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-xs text-muted">{item.description}</span>
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
          Topic / drop focus
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Drop 17 morale booster"
            className="rounded-xl border border-[hsl(var(--color-border)/0.45)] bg-background/80 px-4 py-3 text-sm text-foreground focus:border-[hsl(var(--color-border)/0.8)] focus:ring-2 focus:ring-[hsl(var(--color-focus)/0.5)]"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[hsl(var(--color-primary)/0.9)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[hsl(var(--color-primary))] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Queuing…' : 'Enqueue narrative job'}
        </button>
        <p className="text-xs text-muted">Outputs flow into Social studio (see Dashboard → Playgrounds).</p>
      </form>
    </Surface>
  );
}
