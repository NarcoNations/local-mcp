import type { Metadata } from 'next';

const phases = [
  {
    status: 'Live soon',
    title: 'Spec ingestion',
    description: 'Feed in Whiteboard canvases or Spec-Kit docs to set architecture, routes, and data model.',
    bullets: ['Parses goals, constraints, success metrics', 'Generates repo checklist', 'Links to Historian timeline']
  },
  {
    status: 'Beta',
    title: 'Scaffold generator',
    description: 'Create a repo with routes, API handlers, tests, and prompts for Code Mixer + Prompt Lab.',
    bullets: ['Apply project template presets', 'Seed Playwright + Vitest suites', 'Bootstrap n8n workflows']
  },
  {
    status: 'Planned',
    title: 'Launch runway',
    description: 'Package staging deploys, documentation, and social previews for rapid launch.',
    bullets: ['CI/CD integration', 'Deploy hooks into Social Playground', 'Post-launch health dashboard']
  }
] as const;

const boosters = [
  {
    status: 'Beta',
    title: 'Persona hand-off',
    description: 'Assign persona squads to each deliverable so responsibilities are clear from day one.',
    bullets: ['Strategy Board approval gating', 'Ops Coordinator task board', 'Ethics review checkpoints']
  },
  {
    status: 'Planned',
    title: 'LLM-assisted implementation',
    description: 'Route coding tasks through the LLM router with guardrails and diff review.',
    bullets: ['Local vs cloud budgets', 'Inline risk alerts', 'Code Mixer integration']
  },
  {
    status: 'Planned',
    title: 'Launch retrospectives',
    description: 'Pull metrics, timelines, and prompt performance for post-launch analysis.',
    bullets: ['Historian auto-summary', 'Prompt Lab effectiveness report', 'Automation health recap']
  }
] as const;

export const metadata: Metadata = {
  title: 'One-Shot MVP — VibeMixer',
  description: 'Spin up NarcoNations-ready products from specs, with automation, tests, and persona alignment included.'
};

export default function OneShotMVPPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">One-Shot MVP Generator</span>
          <h1>From canvas to deployable MVP in one command</h1>
          <p>
            Turn Spec-Kit deliverables into scaffolds with routes, schemas, prompts, and automation so NarcoNations teams ship fast without
            missing guardrails.
          </p>
          <div className="actions">
            <span className="pill">Spec ingestion</span>
            <span className="pill">Repo scaffolding</span>
            <span className="pill">Persona hand-off</span>
          </div>
          <p className="section-subtitle">
            Feed a whiteboard snapshot, pick a template, and get a repo with prompts, tests, and automation ready for Strategy Board sign-off.
          </p>
        </div>
        <div className="hero-visual hero-visual-mvp">
          <div className="mvp-node mvp-node-input">
            <span>Canvas / Spec-Kit</span>
          </div>
          <div className="mvp-connector mvp-connector-top" />
          <div className="mvp-node mvp-node-engine">
            <span>One-Shot Engine</span>
            <p>Architecture · Routes · Schema</p>
          </div>
          <div className="mvp-connector mvp-connector-bottom" />
          <div className="mvp-output-grid">
            <div className="mvp-output-card">Repo scaffold</div>
            <div className="mvp-output-card">Prompt pack</div>
            <div className="mvp-output-card">Automation jobs</div>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Build phases</span>
          <h2 className="section-title">Every artifact you need to launch confidently</h2>
          <p className="section-subtitle">
            MVP generator ties together architecture, automation, and persona onboarding. Think of it as a product launch kit in a box.
          </p>
        </header>
        <div className="feature-card-grid">
          {phases.map((card) => (
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
          <span className="section-eyebrow">Boosters</span>
          <h2 className="section-title">Extra tooling to keep teams aligned</h2>
          <p className="section-subtitle">
            MVP output doesn&apos;t stop at code—persona playbooks, router policies, and retrospectives keep the lifecycle healthy.
          </p>
        </header>
        <div className="feature-card-grid">
          {boosters.map((card) => (
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
        <strong>Deploy hooks</strong>
        <p>
          MVP builds can trigger social teasers, Supabase migrations, and automation flows. When you press launch, every squad knows what
          went live.
        </p>
      </section>
    </main>
  );
}
