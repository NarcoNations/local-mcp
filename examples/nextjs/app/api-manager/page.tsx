import type { Metadata } from 'next';

const connectors = [
  {
    status: 'Live soon',
    title: 'Market & intelligence feeds',
    description: 'Normalize AlphaVantage, Finnhub, and bespoke intelligence APIs into a unified data layer.',
    bullets: ['Free-tier routing', 'Caching with Supabase', 'Rate-limit awareness']
  },
  {
    status: 'Beta',
    title: 'Knowledge enrichers',
    description: 'Enrich dossiers with live stats, supply chain indicators, and partner signals.',
    bullets: ['Attach data cards to Research Engine', 'Timeline snapshots to Historian', 'Alerts for Ops Coordinator']
  },
  {
    status: 'Planned',
    title: 'Action triggers',
    description: 'Trigger automations or persona alerts when thresholds or anomalies fire.',
    bullets: ['n8n workflow hooks', 'Prompt Lab readiness signals', 'Feed Social Playground stories']
  }
] as const;

const governance = [
  {
    status: 'Live',
    title: 'API policy engine',
    description: 'Define per-task budgets, retry logic, and fallback models for every integration.',
    bullets: ['Cost ceilings by persona', 'Automatic fallback to cached data', 'LLM router alignment']
  },
  {
    status: 'Beta',
    title: 'Observability stack',
    description: 'Monitor latency, throughput, and error budgets with dashboards and alerts.',
    bullets: ['Prometheus-compatible metrics', 'Historian log ingestion', 'Ops Coordinator alerting']
  },
  {
    status: 'Planned',
    title: 'Partner portal',
    description: 'Share curated API outputs with trusted partners with scoped access.',
    bullets: ['Token-based auth', 'Usage analytics per partner', 'Revocation + rotation policies']
  }
] as const;

export const metadata: Metadata = {
  title: 'API Manager — VibeMixer',
  description: 'Aggregate market, intelligence, and automation APIs with guardrails tailored to NarcoNations.'
};

export default function APIManagerPage() {
  return (
    <main>
      <section className="hero">
        <span className="tagline">API Manager</span>
        <h1>Power NarcoNations with curated data and safe automation</h1>
        <p>
          API Manager wrangles intel feeds, applies budgets, and plugs into automation so VibeMixer has trustworthy external context
          without runaway costs.
        </p>
        <div className="actions">
          <span className="pill">Feeds</span>
          <span className="pill">Budgets</span>
          <span className="pill">Observability</span>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Connectors</span>
          <h2 className="section-title">Bring outside intelligence into the stack</h2>
          <p className="section-subtitle">
            Normalize third-party data to feed Research Engine, Crime Map, and Ops dashboards while keeping usage transparent.
          </p>
        </header>
        <div className="feature-card-grid">
          {connectors.map((card) => (
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
          <span className="section-eyebrow">Governance</span>
          <h2 className="section-title">Policies, observability, and partner sharing</h2>
          <p className="section-subtitle">
            Keep data usage in check with budgets, logging, and partner access controls—all surfaced in Historian.
          </p>
        </header>
        <div className="feature-card-grid">
          {governance.map((card) => (
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
        <strong>Ready for LLM router collaboration</strong>
        <p>
          API Manager exposes cost signals and reliability metrics directly to the LLM router so prompt runs pick the right provider
          on the fly.
        </p>
      </section>
    </main>
  );
}
