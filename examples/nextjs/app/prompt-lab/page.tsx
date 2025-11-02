import type { Metadata } from 'next';

const modules = [
  {
    status: 'Live',
    title: 'Prompt vault',
    description: 'Store, version, and tag prompts for every persona squad with evaluation history.',
    bullets: ['Tone presets (Strategy, Ops, Ethics)', 'Diff view with comments', 'Snapshot to Historian']
  },
  {
    status: 'Beta',
    title: 'Optimizer',
    description: 'Run AB tests across router policies and models to tune for accuracy, latency, and tone.',
    bullets: ['Cost tracking per run', 'Automatic scoring heuristics', 'Promote winning variants to production']
  },
  {
    status: 'Planned',
    title: 'Prompt macros',
    description: 'Bundle prompts with guardrails, retrieval settings, and persona orchestration instructions.',
    bullets: ['Attach tool access policies', 'Sync to One-Shot MVP repos', 'Deploy to ChatGPT plugin manifest']
  }
] as const;

const pipelines = [
  {
    status: 'Live soon',
    title: 'Router dashboards',
    description: 'Track how each prompt performs across local and cloud models with quick rollback controls.',
    bullets: ['Latency histograms', 'Failure snapshots', 'Automatic fallback suggestions']
  },
  {
    status: 'Beta',
    title: 'Safety sweeps',
    description: 'Run moderation and ethics checks before shipping prompt updates.',
    bullets: ['Ethics persona review queue', 'Content filters tuned for NarcoNations', 'See audit trail in Historian']
  },
  {
    status: 'Planned',
    title: 'Distribution',
    description: 'Publish prompt packs to Social Playground, Research Engine, and Code Mixer with one click.',
    bullets: ['Persona-specific bundles', 'Version lock with Supabase', 'Notify squads via timeline']
  }
] as const;

export const metadata: Metadata = {
  title: 'Prompt Lab — VibeMixer',
  description: 'Curate, test, and ship prompt packs across NarcoNations personas with confidence.'
};

export default function PromptLabPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Prompt Lab</span>
          <h1>Govern NarcoNations prompt language at scale</h1>
          <p>
            The Prompt Lab manages tone, evaluation, and distribution for every prompt powering VibeMixer—bridging Router, Research, and
            Social pipelines.
          </p>
          <div className="actions">
            <span className="pill">Prompt vault</span>
            <span className="pill">LLM evaluations</span>
            <span className="pill">Moderation</span>
          </div>
          <p className="section-subtitle">
            Version prompts, run experiments, and ship persona packs with audit trails so Strategy Board and Ethics stay synced.
          </p>
        </div>
        <div className="hero-visual hero-visual-prompt">
          <div className="prompt-scorecard">
            <div>
              <span className="prompt-label">Prompt</span>
              <strong>Strategist · Narrative weave</strong>
            </div>
            <div className="prompt-metric">
              <span>Score</span>
              <strong>4.6</strong>
            </div>
            <div className="prompt-metric">
              <span>Latency</span>
              <strong>2.3s</strong>
            </div>
          </div>
          <div className="prompt-packs">
            <div className="prompt-chip">Ops triage</div>
            <div className="prompt-chip prompt-chip-alt">Historian recap</div>
            <div className="prompt-chip">Ethics moderation</div>
          </div>
          <div className="prompt-router-note">Router: cost-aware-v2 · fallback local-70b</div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Modules</span>
          <h2 className="section-title">Everything required to maintain prompt excellence</h2>
          <p className="section-subtitle">
            Capture, iterate, and approve prompts with traceability so squads stay aligned on tone and intent.
          </p>
        </header>
        <div className="feature-card-grid">
          {modules.map((card) => (
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
          <span className="section-eyebrow">Pipelines</span>
          <h2 className="section-title">From experimentation to distribution</h2>
          <p className="section-subtitle">
            Track prompts through evaluation, moderation, and final deployment into the rest of the VibeMixer stack.
          </p>
        </header>
        <div className="feature-card-grid">
          {pipelines.map((card) => (
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
        <strong>Always in sync</strong>
        <p>
          Prompt Lab events stream into Historian so every update is auditable. Expect Slack/Matrix notifications for persona owners
          when prompts change.
        </p>
      </section>
    </main>
  );
}
