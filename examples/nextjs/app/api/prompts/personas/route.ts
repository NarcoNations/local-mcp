import { NextResponse } from 'next/server';

const personaPacks = {
  updatedAt: '2025-10-29T17:00:00Z',
  packs: [
    {
      persona: 'Strategy Board',
      prompts: ['Narrative weave', 'Executive briefing condensation', 'Signal prioritiser'],
      tone: 'Aspirational, data-backed, decisive'
    },
    {
      persona: 'Ops Coordinator',
      prompts: ['Watcher triage', 'Incident escalation memo', 'Automation audit'],
      tone: 'Operational, precise, time-aware'
    },
    {
      persona: 'Ideas Lab',
      prompts: ['StoryBoard riff', 'Social Playground seed', 'Interactive prototype brief'],
      tone: 'Exploratory, visual, energetic'
    }
  ],
  todo: ['Add Ethics + Safety moderation macros', 'Bundle cross-persona call-and-response templates']
};

export async function GET() {
  return NextResponse.json({ ok: true, personaPacks }, { status: 200 });
}
