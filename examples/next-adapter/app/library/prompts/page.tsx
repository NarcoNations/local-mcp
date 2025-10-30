import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { PromptsClient, type PromptRecord } from './client';

const FALLBACK_PROMPTS: PromptRecord[] = [
  {
    id: 'brand-tone',
    title: 'Brand tone + hook',
    description: 'Summarise key differentiators in Narco Noir style.',
    body: 'You are the VibeOS narrative lead. Summarise the core idea in 3 bullets with an evocative hook and a closing CTA.',
    tags: ['tone', 'summary'],
    task: 'draft_copy'
  },
  {
    id: 'research-brief',
    title: 'Research brief outline',
    description: 'Produce facts / insights / sources for a new dossier.',
    body: 'Given the context, provide three facts, two insights, and credible sources. Keep copy concise.',
    tags: ['research', 'analysis'],
    task: 'summarize'
  }
];

export default async function PromptsPage() {
  let prompts: PromptRecord[] = FALLBACK_PROMPTS;
  let errorMessage: string | null = null;
  if (process.env.SUPABASE_URL) {
    try {
      const sb = sbServer();
      const { data, error } = await sb.from('prompts').select('id, title, body, description, tags, task').limit(50);
      if (!error && data && data.length) {
        prompts = data as PromptRecord[];
      } else if (error) {
        errorMessage = error.message;
      }
    } catch (err: any) {
      errorMessage = err?.message || 'Unable to fetch prompts from Supabase';
    }
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Prompt Library</h1>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.65)', maxWidth: 720 }}>
          Browse reusable prompts, capture descriptions, and fire a quick LLM test run without leaving the dashboard.
        </p>
        {errorMessage && <span style={{ color: 'rgb(180,0,0)', fontSize: '0.85rem' }}>{errorMessage}</span>}
      </header>
      <PromptsClient prompts={prompts} />
    </div>
  );
}
