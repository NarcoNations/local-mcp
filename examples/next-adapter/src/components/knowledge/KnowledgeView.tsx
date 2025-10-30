"use client";

import { useState } from "react";
import { Card } from "../Card";
import { Toolbar } from "../Toolbar";
import { useToast } from "../Toast";
import type { KnowledgeEntry } from "../../types/app";
import { indexKnowledge } from "../../data/knowledge";
import { relativeTime } from "../../utils/time";

interface KnowledgeViewProps {
  entries: KnowledgeEntry[];
}

export function KnowledgeView({ entries }: KnowledgeViewProps) {
  const { push } = useToast();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const handleIndex = async (slug: string) => {
    setPendingSlug(slug);
    try {
      const result = await indexKnowledge(slug);
      if (result.ok) {
        push({
          title: "Index started",
          description: `${slug} is being indexed.`,
          variant: "success",
        });
      } else {
        push({
          title: "Index request failed",
          description: `Could not index ${slug}.`,
          variant: "danger",
        });
      }
    } catch (error) {
      push({
        title: "Index request failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "danger",
      });
    } finally {
      setPendingSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Knowledge graph"
        description="Curated slugs ready for synthesis and downstream reasoning."
        actions={<span className="text-xs text-muted">Index operations stream to Historian in real time.</span>}
      />
      <Card title="Knowledge entries" description="Manage ingestion status and trigger indexing." variant="elevated">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-primary">
                  <td className="px-4 py-3 font-medium">{entry.slug}</td>
                  <td className="px-4 py-3">{entry.files}</td>
                  <td className="px-4 py-3 text-muted">{relativeTime(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleIndex(entry.slug)}
                      disabled={pendingSlug === entry.slug}
                      className="focus-ring inline-flex items-center justify-center rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary disabled:opacity-60"
                    >
                      {pendingSlug === entry.slug ? "Indexing..." : "Index"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
