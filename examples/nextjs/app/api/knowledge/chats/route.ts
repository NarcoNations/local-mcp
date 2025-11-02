import { NextResponse } from 'next/server';

const chats = {
  summary: {
    conversations: 1029,
    personasTagged: ['Strategist', 'Ops Coordinator', 'Historian'],
    lastImported: '2025-10-31T16:08:00Z'
  },
  highlights: [
    {
      title: 'Ops Coordinator — Antwerp interdiction plan',
      messages: 42,
      tags: ['Logistics', 'Port security', 'Narcotics'],
      link: '/docs/chatgpt-export-md/ops-coordinator-antwerp.md'
    },
    {
      title: 'Strategist — Campaign tone workshop',
      messages: 28,
      tags: ['Narrative', 'Messaging'],
      link: '/docs/chatgpt-export-md/strategy-tone-workshop.md'
    },
    {
      title: 'Historian — Timeline alignment',
      messages: 33,
      tags: ['Historian', 'Archive'],
      link: '/docs/chatgpt-export-md/historian-timeline-sync.md'
    }
  ],
  nextSteps: [
    'Tag new conversations with persona + intent labels.',
    'Promote highlights into Prompt Library references.',
    'Export timeline snapshots to the Historian UI.'
  ]
};

export async function GET() {
  return NextResponse.json({ ok: true, chats }, { status: 200 });
}
