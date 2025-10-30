'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../Card';
import { useToast } from '../Toast';

interface MvpSummary {
  architecture: string;
  routes: string[];
  nextSteps: string[];
}

export function MvpView() {
  const { push } = useToast();
  const [concept, setConcept] = React.useState('');
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<MvpSummary | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!concept.trim()) {
      push({ title: 'Describe the MVP vision', tone: 'warn' });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mock: MvpSummary = {
      architecture: 'Edge ingest → historian → knowledge → GPT orchestration → social forge loops.',
      routes: ['/api/ingest/convert', '/api/knowledge/index', '/api/mvp/generate'],
      nextSteps: [
        'Finalize schema + supabase tables',
        'Wire MVP generator to historian events',
        'Stage launch ritual + fallback triggers',
      ],
    };
    setSummary(mock);
    setShowModal(true);
    setLoading(false);
    push({ title: 'MVP recipe generated', tone: 'success' });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="One-shot MVP brief" description="Feed it context and it will return a starter architecture, routes, data, and PR stub.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Concept</span>
            <textarea
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="Narco Nations OS companion that fuses historian and social forge."
              className="min-h-[160px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Attach brief.json (optional)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-none file:bg-[color:var(--color-accent-soft)] file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:text-foreground"
            />
            {fileName && <span className="text-xs text-muted">Attached: {fileName}</span>}
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-[color:var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-transform duration-interactive hover:-translate-y-[1px]"
            disabled={loading}
          >
            {loading ? 'Synthesizing…' : 'Generate blueprint'}
          </button>
        </form>
      </Card>
      <AnimatePresence>
        {showModal && summary && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-scrim)] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">MVP blueprint ready</h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Architecture</span>
                  <p className="mt-1 text-foreground">{summary.architecture}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Routes</span>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {summary.routes.map((route) => (
                      <li key={route} className="text-foreground">{route}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Next steps</span>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {summary.nextSteps.map((step) => (
                      <li key={step} className="text-foreground">{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
