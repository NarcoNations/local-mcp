import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import PromptsClient from './PromptsClient';

export type PromptRecord = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  task: 'draft_copy' | 'summarize' | 'classify';
};

const fallbackPrompts: PromptRecord[] = [
  {
    id: 'spec-brief',
    title: 'Spec-Kit Brief Outline',
    body: 'You are the VibeOS Archivist. Draft a concise project brief covering ingest, embeddings, search, and historian. Highlight the lanes that must ship first.',
    tags: ['brief', 'spec-kit'],
    task: 'draft_copy'
  },
  {
    id: 'retro-summary',
    title: 'Sprint Retro Summary',
    body: 'Summarise the last sprint for the Strategy Board. Capture 3 wins, 3 blockers, and 3 experiments for next cycle.',
    tags: ['retro', 'ops'],
    task: 'summarize'
  },
  {
    id: 'risk-scan',
    title: 'Risk Scan Classifier',
    body: 'Classify this idea across: security, ethics, compliance, brand. Return yes/no per category with a one-line rationale.',
    tags: ['ethics', 'risk'],
    task: 'classify'
  }
];

export default async function PromptsPage() {
  const prompts = await loadPrompts();
  return <PromptsClient prompts={prompts} />;
}

async function loadPrompts(): Promise<PromptRecord[]> {
  try {
    const sb = sbServer();
    const { data } = await sb
      .from('prompts')
      .select('id, title, body, tags, task')
      .order('title', { ascending: true });
    if (data && data.length) {
      return data.map((row: any) => ({
        id: String(row.id),
        title: row.title || 'Untitled prompt',
        body: row.body || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        task: normalizeTask(row.task)
      }));
    }
  } catch (_) {
    // fall back to local stubs when Supabase is unavailable
  }
  return fallbackPrompts;
}

function normalizeTask(value: any): PromptRecord['task'] {
  if (value === 'classify' || value === 'summarize' || value === 'draft_copy') return value;
  return 'draft_copy';
}
