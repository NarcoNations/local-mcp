import type { Metadata } from 'next';

const canvases = [
  {
    status: 'Live soon',
    title: 'Spec-first canvases',
    description: 'Drag-and-drop nodes for problems, hypotheses, and acceptance criteria that export straight into Spec-Kit docs.',
    bullets: ['Swimlanes for Strategy, Ops, Build, Ethics', 'Snapshots auto-sync to Historian', 'Export to Markdown or SVG']
  },
  {
    status: 'Beta',
    title: 'Persona collaboration',
    description: 'Summon persona panels to annotate nodes with intent, risk, and required follow-ups.',
    bullets: ['Inline chat with Strategy Board + Ops Coordinator', 'Persona-aware prompt macros', 'Tagging feeds Research Engine']
  },
  {
    status: 'Planned',
    title: 'Whiteboard → MVP hand-off',
    description: 'Send a canvas to One-Shot MVP to scaffold repositories and prompt packs from a single click.',
    bullets: ['Auto-generate repo outline', 'Map tasks into Historian timeline', 'Kick off n8n automation for ingest']
  }
] as const;

const timeline = [
  {
    phase: 'Phase 1',
    title: 'Canvas primitives & exports',
    detail: 'Node graph, swimlane templates, and Spec-Kit export pipelines.'
  },
  {
    phase: 'Phase 2',
    title: 'Live persona overlays',
    detail: 'In-surface chat, risk markers, and prompt macros per squad.'
  },
  {
    phase: 'Phase 3',
    title: 'Automation hooks',
    detail: 'n8n triggers, MVP generator bridge, and Historian event snapshots.'
  }
] as const;

export const metadata: Metadata = {
  title: 'Whiteboard OS — VibeMixer',
  description: 'Plan initiatives with spatial canvases that sync to Spec-Kit, persona prompts, and automation flows.'
};

export default function WhiteboardPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Whiteboard OS</span>
          <h1>Spatial command surface for NarcoNations projects</h1>
          <p>
            Map ideas, risks, and deliverables in an adaptive canvas that exports clean specs, alerts Historian, and primes the One-Shot
            MVP generator.
          </p>
          <div className="actions">
            <span className="pill">Spec-Kit export</span>
            <span className="pill">Persona overlays</span>
            <span className="pill">Automation triggers</span>
          </div>
          <p className="section-subtitle">
            Drag cards into persona lanes, tag risks, and promote snapshots to Spec-Kit with source trails so the Strategy Board always
            sees the latest plan.
          </p>
        </div>
        <div className="hero-visual hero-visual-board">
          <div className="board-columns">
            <div className="board-column">
              <span className="board-column-title">Strategy</span>
              <div className="board-card">
                <strong>North Sea interdiction arc</strong>
                <p>Focus Antwerp → Rotterdam corridor. Align messaging with Ethics persona.</p>
              </div>
              <div className="board-card board-card-ghost">
                <strong>Partner briefing</strong>
                <p>Draft key talking points.</p>
              </div>
            </div>
            <div className="board-column">
              <span className="board-column-title">Ops</span>
              <div className="board-card">
                <strong>Watcher rollout</strong>
                <p>Configure n8n ingest + alert thresholds.</p>
              </div>
              <div className="board-card">
                <strong>Supabase sync</strong>
                <p>Mirror docs/chat exports, run embedding refresh.</p>
              </div>
            </div>
            <div className="board-column">
              <span className="board-column-title">Build</span>
              <div className="board-card">
                <strong>MVP scaffold</strong>
                <p>Trigger One-Shot to seed repo + tests.</p>
              </div>
              <div className="board-card board-card-highlight">
                <strong>Persona overlays</strong>
                <p>Enable Strategy + Ethics view for sign-off.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Canvas modes</span>
          <h2 className="section-title">Frame strategy, ops, and build plans visually</h2>
          <p className="section-subtitle">
            Kick off initiatives with templates tuned to NarcoNations workflows—research arcs, campaign beats, or infrastructure work
            packages.
          </p>
        </header>
        <div className="feature-card-grid">
          {canvases.map((card) => (
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
          <span className="section-eyebrow">Roadmap</span>
          <h2 className="section-title">Whiteboard OS rollout</h2>
          <p className="section-subtitle">
            Each milestone deepens the bridge between visual ideation and operational delivery—from canvases to automation triggers.
          </p>
        </header>
        <div className="timeline">
          {timeline.map((item) => (
            <article className="timeline-item" key={item.title}>
              <span className="timeline-meta">{item.phase}</span>
              <h3 className="timeline-title">{item.title}</h3>
              <p className="persona-focus">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-callout">
        <strong>Coming up next</strong>
        <p>
          We are prototyping node-to-MVP flows that attach acceptance criteria, automate backlog creation, and notify the relevant
          persona squads. Drop your canvas in VibeMixer and watch Spec-Kit, Historian, and One-Shot MVP sync automatically.
        </p>
      </section>
    </main>
  );
}
