import type { Metadata } from 'next';

const plays = [
  {
    status: 'Live',
    title: 'Plan → Gather → Synthesise',
    description: 'Hybrid search, Historian chats, and dossiers feed a structured plan template with facts, insights, and actions.',
    bullets: ['Flexible query prompts', 'Auto-citations with anchors', 'Exports to Obsidian + Supabase']
  },
  {
    status: 'Beta',
    title: 'Persona co-pilots',
    description: 'Pair Strategy Board, Ops, and Ethics personas to validate outputs and propose follow-up questions.',
    bullets: ['Persona macros applied to prompts', 'Feedback loops logged to Historian', 'Risk callouts highlighted']
  },
  {
    status: 'Planned',
    title: 'Multi-turn research journeys',
    description: 'Chain plans into story arcs, with branching options and recommended content drops.',
    bullets: ['Timeline export to Historian', 'Auto-generate Social Playground assets', 'Feed into Crime-Map overlays']
  }
] as const;

const outputs = [
  {
    status: 'Live soon',
    title: 'Briefs & reports',
    description: 'Generate narrative-ready briefs with facts, insights, and recommended actions.',
    bullets: ['Exec summary mode', 'Ops checklist view', 'Embed citations inline']
  },
  {
    status: 'Beta',
    title: 'Fact packs',
    description: 'Assemble data-heavy packs for distribution or social content, with supporting assets attached.',
    bullets: ['Charts + tables from Supabase', 'Historian timeline snapshots', 'Direct link to Multi-format transformer']
  },
  {
    status: 'Planned',
    title: 'Interactive dossiers',
    description: 'Publish research outcomes into Showroom or NarcoNations.org with diff tracking and review flows.',
    bullets: ['Cross-link to Spec-Kit', 'Auto-notify persona teams', 'Embed Code Mixer components']
  }
] as const;

export const metadata: Metadata = {
  title: 'Research Engine — VibeMixer',
  description: 'Orchestrate NarcoNations research journeys with hybrid search, persona prompts, and narrative outputs.'
};

export default function ResearchEnginePage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Research Engine</span>
          <h1>Turn open questions into narrative-ready intelligence</h1>
          <p>
            The Research Engine blends hybrid search, Historian timelines, and persona prompts to deliver structured plans, briefs, and
            follow-up actions.
          </p>
          <div className="actions">
            <span className="pill">Hybrid search</span>
            <span className="pill">Persona co-pilots</span>
            <span className="pill">Narrative exports</span>
          </div>
          <p className="section-subtitle">
            Create research plans, gather Corpus citations, and hand results straight to Strategy Board or Social Playground with zero
            context lost.
          </p>
        </div>
        <div className="hero-visual hero-visual-research">
          <div className="research-card research-card-primary">
            <span className="research-label">Plan</span>
            <h3>North Sea interdiction brief</h3>
            <p>Blend hybrid search with Historian chatter to surface corridor risks.</p>
            <ul>
              <li>12 citations</li>
              <li>3 persona comments</li>
            </ul>
          </div>
          <div className="research-card research-card-secondary">
            <span className="research-label">Insights</span>
            <h3>Ops checklist</h3>
            <p>Watcher coverage, priority alerts, and pipeline triggers summarised.</p>
          </div>
          <div className="research-card research-card-tertiary">
            <span className="research-label">Outputs</span>
            <p>Fact pack → Multi-format transformer → Social Playground queue.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Workflow</span>
          <h2 className="section-title">Everything you need from first question to deliverable</h2>
          <p className="section-subtitle">
            Plug in a question, let VibeMixer propose a plan, and review persona feedback before committing to action.
          </p>
        </header>
        <div className="feature-card-grid">
          {plays.map((card) => (
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
          <span className="section-eyebrow">Output formats</span>
          <h2 className="section-title">Choose the right wrap-up for your audience</h2>
          <p className="section-subtitle">
            Whether Strategy Board needs a deck or Ops requires a checklist, research outputs slot directly into existing workflows.
          </p>
        </header>
        <div className="feature-card-grid">
          {outputs.map((card) => (
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
        <strong>LLM router ready</strong>
        <p>
          Every plan can run through the upcoming LLM router to balance local and cloud models. Expect deterministic outputs with cost
          transparency.
        </p>
      </section>
    </main>
  );
}
