import { NextResponse } from 'next/server';

const socialQueue = {
  updatedAt: '2025-11-01T22:46:00Z',
  scheduled: [
    {
      id: 'social-014',
      channel: 'Instagram Reels',
      status: 'ready',
      publishAt: '2025-11-02T16:00:00Z',
      summary: '60s explainer on Antwerp interdiction wins with visual overlays.',
      source: 'Research Engine · Port Vigil brief'
    },
    {
      id: 'social-015',
      channel: 'Newsletter',
      status: 'draft',
      publishAt: '2025-11-03T12:00:00Z',
      summary: 'Historian recap with timeline snapshots and partner shout-outs.',
      source: 'Historian timeline digest'
    },
    {
      id: 'social-016',
      channel: 'X/Twitter',
      status: 'review',
      publishAt: '2025-11-01T23:30:00Z',
      summary: 'Thread on supply chain shell companies flagged by Ops Coordinator.',
      source: 'Automation pipeline alert'
    }
  ],
  actions: ['Sync with Social Playground UI', 'Attach A/B prompt experiments', 'Notify Ethics for final review']
};

export async function GET() {
  return NextResponse.json({ ok: true, socialQueue }, { status: 200 });
}
