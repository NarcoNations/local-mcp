import { sbServer } from '@/examples/next-adapter/lib/supabase/server';
import { PromptLibrary } from './PromptLibrary';

type PromptRecord = {
  id: string;
  title: string;
  body: string;
  description?: string | null;
};

const stubPrompts: PromptRecord[] = [
  {
    id: 'market-scan',
    title: 'Market Scan',
    description: 'Summarise competitors, positioning, and whitespace for a product idea.',
    body: 'You are an analyst at VibeLabz. Summarise the current landscape for {{idea}}. Include 3 competitor notes and 3 opportunities.'
  },
  {
    id: 'launch-teaser',
    title: 'Launch Teaser Draft',
    description: 'Create a social-ready teaser based on an MVP concept.',
    body: 'You are the creative copy lead. Draft a 120-word teaser for {{product}} targeting {{audience}}.'
  },
  {
    id: 'retro',
    title: 'Sprint Retro',
    description: 'Capture wins, blockers, and next moves for the latest sprint.',
    body: 'Generate a sprint retrospective summary with sections for Highlights, Risks, and Next Sprint Focus.'
  }
];

export default async function PromptLibraryPage() {
  let prompts = stubPrompts;
  try {
    const sb = sbServer();
    const { data } = await sb.from('prompts').select('id, title, body, description').order('title');
    if (Array.isArray(data) && data.length) prompts = data as PromptRecord[];
  } catch (_) {
    // fallback to stub when table missing or request fails
  }

  return (
    <main style={{ padding: 'min(4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)', margin: 0 }}>Prompt Library</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.5 }}>
          Curate reusable prompt patterns for research, ideation, and publishing. Click a prompt to inspect and run it against the
          LLM router.
        </p>
      </header>
      <PromptLibrary prompts={prompts} />
    </main>
  );
}
