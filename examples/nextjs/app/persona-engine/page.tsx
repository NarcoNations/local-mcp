import type { Metadata } from 'next';

const personas = [
  {
    status: 'Live',
    title: 'Squad roster',
    description: 'Define personas, roles, and tool permissions for Strategy Board, Ops, Ethics, Historian, and more.',
    bullets: ['Role-specific dashboards', 'Tool access controls', 'Prompt presets per persona']
  },
  {
    status: 'Beta',
    title: 'Modes & playbooks',
    description: 'Switch between Solo, Panel, Offensive, and Defensive modes to adapt automation and tone.',
    bullets: ['Mode-specific prompt macros', 'Automation toggles', 'Historian logs for persona decisions']
  },
  {
    status: 'Planned',
    title: 'Persona orchestration',
    description: 'Coordinate multiple personas in conversations or workflows for richer outputs.',
    bullets: ['Shared memory window', 'Conflict resolution hints', 'Feedback to Prompt Lab and Research Engine']
  }
] as const;

const governance = [
  {
    status: 'Live soon',
    title: 'Persona health dashboard',
    description: 'Track activity, pending reviews, and outstanding tasks for each persona team.',
    bullets: ['Workload balance indicators', 'Review SLA monitoring', 'Integration with Historian timeline']
  },
  {
    status: 'Beta',
    title: 'Escalation policies',
    description: 'Define who gets pinged when automation or output requires human oversight.',
    bullets: ['Ops & Ethics escalation ladders', 'Slack/Matrix notifications', 'Audit logs retained']
  },
  {
    status: 'Planned',
    title: 'Persona simulations',
    description: 'Run what-if scenarios to test how personas would respond to emerging situations.',
    bullets: ['Inject synthetic events', 'Score alignment with policies', 'Loop outputs to Strategy Board']
  }
] as const;

export const metadata: Metadata = {
  title: 'Persona Engine — VibeMixer',
  description: 'Coordinate NarcoNations persona squads with playbooks, permissions, and health dashboards.'
};

export default function PersonaEnginePage() {
  return (
    <main>
      <section className="hero">
        <span className="tagline">Persona Engine</span>
        <h1>Operationalise NarcoNations roles in one system</h1>
        <p>
          Persona Engine defines capabilities, prompts, and protections for every squad—from Strategy Board directives to Ethics
          oversight—so automation stays aligned.
        </p>
        <div className="actions">
          <span className="pill">Playbooks</span>
          <span className="pill">Permissions</span>
          <span className="pill">Health</span>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Foundation</span>
          <h2 className="section-title">Map every persona to tools and prompts</h2>
          <p className="section-subtitle">
            Keep responsibilities explicit and maintain a single source of truth for who can run which automation.
          </p>
        </header>
        <div className="feature-card-grid">
          {personas.map((card) => (
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
          <h2 className="section-title">Visibility and guardrails in one place</h2>
          <p className="section-subtitle">
            Monitor workload, escalate reviews, and simulate persona responses before they hit production.
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
        <strong>Persona everywhere</strong>
        <p>
          The persona roster powers Whiteboard overlays, Prompt Lab packs, Research Engine co-pilots, and automation approvals. Persona
          Engine keeps them consistent.
        </p>
      </section>
    </main>
  );
}
