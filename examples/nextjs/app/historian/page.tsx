import type { Metadata } from 'next';

const capabilities = [
  {
    status: 'Live',
    title: 'Event ledger',
    description: 'Log every ingest, prompt update, deployment, and automation run with structured metadata.',
    bullets: ['JSON schema with actor + persona', 'Timeline UI snapshots', 'Searchable by tags + severity']
  },
  {
    status: 'Beta',
    title: 'Chat corpus integration',
    description: 'Import ChatGPT exports into conversations, messages, and tags for durable recall.',
    bullets: ['Persona tagging', 'LLM summarisation hooks', 'Link to Research Engine contexts']
  },
  {
    status: 'Planned',
    title: 'Historian insights',
    description: 'Summarise the last day/week/month automatically with highlights for each squad.',
    bullets: ['Prompt Lab recap macros', 'Visual timeline rollups', 'Alerts for anomalies']
  }
] as const;

const surfaces = [
  {
    status: 'Live soon',
    title: 'Timeline UI',
    description: 'Responsive view with filters, drill-down, and export to CSV or Markdown.',
    bullets: ['Persona filters', 'Event type quick toggles', 'Export to briefs or retros']
  },
  {
    status: 'Beta',
    title: 'Historian API',
    description: 'Expose REST + SSE endpoints so other services or AI agents can consume event streams.',
    bullets: ['Server-sent events', 'Secure tokens per client', 'Replay window controls']
  },
  {
    status: 'Planned',
    title: 'Historian alerts',
    description: 'Define rules to notify Ops or Strategy when thresholds are crossed or anomalies appear.',
    bullets: ['Slack/Matrix integration', 'Custom severity filters', 'Links to response playbooks']
  }
] as const;

export const metadata: Metadata = {
  title: 'Historian — VibeMixer',
  description: 'Centralise NarcoNations activity with searchable timelines, chat imports, and automated recaps.'
};

export default function HistorianPage() {
  return (
    <main>
      <section className="hero">
        <span className="tagline">Historian</span>
        <h1>Keep a living timeline of NarcoNations operations</h1>
        <p>
          Historian captures events, chats, and summaries so teams always know what happened, when it happened, and who owns the next
          move.
        </p>
        <div className="actions">
          <span className="pill">Event logs</span>
          <span className="pill">Chat corpus</span>
          <span className="pill">Automated recaps</span>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Capabilities</span>
          <h2 className="section-title">Audit everything without slowing down</h2>
          <p className="section-subtitle">
            Every piece of activity becomes searchable, shareable context. Historian makes compliance and storytelling effortless.
          </p>
        </header>
        <div className="feature-card-grid">
          {capabilities.map((card) => (
            <article className="feature-card" key={card.title}>
              <div className="feature-card-header">
                <span className="feature-card-eyebrow">{card.status}</span>
                <h3>{card.title}</h3>
              </div>
              <p>{card.description}</p>
              <ul>
                {card.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Surfaces</span>
          <h2 className="section-title">Review, stream, and alert</h2>
          <p className="section-subtitle">
            Timeline UI, API access, and customizable alerts make Historian the nerve center for accountability.
          </p>
        </header>
        <div className="feature-card-grid">
          {surfaces.map((card) => (
            <article className="feature-card" key={card.title}>
              <div className="feature-card-header">
                <span className="feature-card-eyebrow">{card.status}</span>
                <h3>{card.title}</h3>
              </div>
              <p>{card.description}</p>
              <ul>
                {card.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-callout">
        <strong>Historian + VibeMixer</strong>
        <p>
          Expect deep links from every feature. Whiteboard canvases, MVP deploys, social drops, and research plans all register here so
          leadership stays informed.
        </p>
      </section>
    </main>
  );
}
