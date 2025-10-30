'use client';

import { useEffect, useState } from 'react';
import { Surface } from '../../src/components/Surface';
import { Pill } from '../../src/components/Pill';
import { Stat } from '../../src/components/Stat';
import { useToast } from '../../src/components/Toast';
import { getKnowledgeRecords, indexKnowledgeRecord } from '../../src/lib/dataClient';
import { KnowledgeRecord } from '../../src/types/systems';

export default function KnowledgePage() {
  const toast = useToast();
  const [records, setRecords] = useState<KnowledgeRecord[]>([]);
  const [isIndexing, setIndexing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getKnowledgeRecords();
      setRecords(data);
    })();
  }, []);

  const handleIndex = async (id: string) => {
    setIndexing(id);
    try {
      const result = await indexKnowledgeRecord(id);
      toast.publish({ title: 'Knowledge index updated', description: `Status: ${result.status}.` });
    } catch (error) {
      console.error(error);
      toast.publish({ title: 'Index failed', description: 'Check pipeline status in Historian.' });
    } finally {
      setIndexing(null);
    }
  };

  return (
    <div className="space-y-8">
      <Surface title="Knowledge graph" toolbar={<span className="text-xs text-muted">Narco Noir → VibeLabz sync</span>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Nodes" value={records.length} hint="Active knowledge entries" />
          <Stat
            label="Average files"
            value={records.length ? Math.round(records.reduce((acc, item) => acc + item.files, 0) / records.length) : '—'}
            hint="Per knowledge slug"
          />
          <Stat label="Ready" value={records.filter((record) => record.status === 'ready').length} hint="Indexed and queryable" />
        </div>
      </Surface>
      <Surface title="Knowledge inventory" toolbar={<span className="text-xs text-muted">Index + QA</span>}>
        <div className="overflow-x-auto rounded-xl border border-[hsl(var(--color-border)/0.45)]">
          <table className="min-w-full divide-y divide-[hsl(var(--color-border)/0.35)] text-sm">
            <thead className="bg-surface-subdued/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Indexed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--color-border)/0.15)]">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-[hsl(var(--color-cyan)/0.08)]">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{record.slug}</span>
                      <span className="text-xs text-muted">{record.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{record.files}</td>
                  <td className="px-4 py-3">
                    <Pill tone={record.status === 'ready' ? 'success' : record.status === 'pending' ? 'info' : 'warn'}>
                      {record.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(record.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleIndex(record.id)}
                      disabled={isIndexing === record.id}
                      className="rounded-lg border border-[hsl(var(--color-border)/0.45)] px-3 py-2 text-xs font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isIndexing === record.id ? 'Indexing…' : 'Index now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
