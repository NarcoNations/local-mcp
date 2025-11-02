import { NextResponse } from 'next/server';

const factpack = {
  generatedAt: '2025-11-01T22:43:00Z',
  audience: 'Executive briefing',
  sections: [
    {
      heading: 'Snapshot',
      bullets: [
        'Antwerp remains the highest throughput corridor with 38% of EU cocaine seizures.',
        'Average interdiction delay dropped to 46 minutes after Watcher automation rollout.',
        'Historian flagged 6 new logistics shell companies in the last 14 days.'
      ]
    },
    {
      heading: 'Signals to watch',
      bullets: [
        'Rail freight anomalies from Antwerp to Cologne spiking (+18% week over week).',
        'Local chatter referencing “Project Tideway” in Historian transcripts.',
        'Customs staffing shortages reported in Brussels press (Nov 1).'
      ]
    },
    {
      heading: 'Recommended callouts',
      bullets: [
        'Feature the Historian timeline snapshot in next newsletter.',
        'Prep targeted outreach assets for civil society partners in Antwerp.',
        'Greenlight Ops Coordinator social audit of shell networks.'
      ]
    }
  ],
  attachments: [
    { type: 'pdf', title: 'Antwerp interdiction metrics (Q4 preview)', link: '/docs/dossiers/antwerp-metrics-preview.pdf' },
    { type: 'md', title: 'Historian timeline — Oct highlights', link: '/docs/chatgpt-export-md/historian-october-highlights.md' }
  ]
};

export async function GET() {
  return NextResponse.json({ ok: true, factpack }, { status: 200 });
}
