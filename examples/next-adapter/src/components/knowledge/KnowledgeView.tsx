'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { useToast } from '../Toast';
import type { KnowledgeEntry } from '../../mocks/knowledge';

interface KnowledgeViewProps {
  entries: KnowledgeEntry[];
}

function statusTone(status: KnowledgeEntry['status']) {
  switch (status) {
    case 'indexed':
      return 'success' as const;
    case 'pending':
      return 'info' as const;
    case 'error':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
}

export function KnowledgeView({ entries }: KnowledgeViewProps) {
  const { push } = useToast();
  const [indexingId, setIndexingId] = React.useState<string | null>(null);

  const handleIndex = async (entry: KnowledgeEntry) => {
    setIndexingId(entry.id);
    try {
      const response = await fetch('/api/knowledge/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: entry.slug }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }
      push({ title: 'Index job queued', description: entry.slug, tone: 'success' });
    } catch (error: any) {
      push({ title: 'Indexing failed', description: error?.message ?? 'Unknown error', tone: 'error' });
    } finally {
      setIndexingId(null);
    }
  };

  return (
    <Card
      title="Knowledge index"
      description="Manage semantic packs. Re-index when new ingests land."
      toolbar={
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
        >
          Search knowledge
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-subdued text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Files</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="bg-surface">
                <td className="px-4 py-3 text-foreground">{entry.title}</td>
                <td className="px-4 py-3 text-xs text-muted">{entry.slug}</td>
                <td className="px-4 py-3 text-muted">{entry.files}</td>
                <td className="px-4 py-3">
                  <Pill tone={statusTone(entry.status)}>{entry.status}</Pill>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleIndex(entry)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-interactive hover:text-foreground"
                    disabled={indexingId === entry.id}
                  >
                    {indexingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Index'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
