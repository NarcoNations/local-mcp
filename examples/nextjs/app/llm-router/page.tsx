import type { Metadata } from 'next';

const controls = [
  {
    status: 'Live soon',
    title: 'Policy definitions',
    description: 'Set routing rules per task: cost caps, models allowed, fallback hierarchy, and privacy flags.',
    bullets: ['Persona-aware policies', 'Task categories (Research, Ops, Social)', 'Audit-friendly YAML configuration']
  },
  {
    status: 'Beta',
    title: 'Telemetry loop',
    description: 'Track latency, cost, and success to refine routing heuristics automatically.',
    bullets: ['Prometheus metrics', 'Alerts for drift', 'Historian snapshots for anomalies']
  },
  {
    status: 'Planned',
    title: 'Adaptive routing',
    description: 'Learn optimal provider mix based on recent performance, budgets, and persona feedback.',
    bullets: ['Feedback from Prompt Lab', 'Cost smoothing across billing periods', 'Auto-suggest policy updates']
  }
] as const;

const integrations = [
  {
    status: 'Live',
    title: 'Prompt Lab',
    description: 'Every prompt run logs router choices so evaluations and AB tests stay grounded.',
    bullets: ['Variant-level metrics', 'Failure triage suggestions', 'Rollbacks in one click']
  },
  {
    status: 'Beta',
    title: 'Research Engine',
    description: 'Plans specify tone, latency, and privacy requirements consumed by the router.',
    bullets: ['Embeddings vs generation splits', 'Local-first preference toggles', 'Fallback prompts pre-generated']
  },
  {
    status: 'Planned',
    title: 'Automation & Ops',
    description: 'Ops Coordinator defines service windows and offline modes for sensitive tasks.',
    bullets: ['Offline queue for local models', 'Emergency kill switch', 'Alerts for quota exhaustion']
  }
] as const;

export const metadata: Metadata = {
  title: 'LLM Router — VibeMixer',
  description: 'Balance local and cloud language models with policy, telemetry, and automation hooks.'
};

export default function LLMRouterPage() {
  return (
    <main>
      <section className="hero">
        <span className="tagline">LLM Router</span>
        <h1>Make smart choices between local and cloud models</h1>
        <p>
          The router enforces policy, tracks performance, and keeps NarcoNations prompts within budget while respecting privacy
          guardrails.
        </p>
        <div className="actions">
          <span className="pill">Policies</span>
          <span className="pill">Telemetry</span>
          <span className="pill">Integrations</span>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Controls</span>
          <h2 className="section-title">Fine-grained policies and adaptive intelligence</h2>
          <p className="section-subtitle">
            Define who can call which models, how much to spend, and how to fail gracefully if providers misbehave.
          </p>
        </header>
        <div className="feature-card-grid">
          {controls.map((card) => (
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
          <span className="section-eyebrow">Stack integration</span>
          <h2 className="section-title">Router decisions feed every surface</h2>
          <p className="section-subtitle">
            Prompt Lab, Research Engine, and Automation teams can see how models were chosen and intervene when needed.
          </p>
        </header>
        <div className="feature-card-grid">
          {integrations.map((card) => (
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
        <strong>Safety by design</strong>
        <p>
          Router policies live alongside Ethics and Ops review. When new models ship, the router can sandbox them for persona testing
          before production.
        </p>
      </section>
    </main>
  );
}
