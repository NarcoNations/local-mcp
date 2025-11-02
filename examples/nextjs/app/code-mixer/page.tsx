import type { Metadata } from 'next';

const stacks = [
  {
    status: 'Live soon',
    title: 'Component Library sync',
    description: 'Import Vibe tokens and ship-ready UI primitives into Code Mixer for instant prototyping.',
    bullets: ['Token-aware palettes + typography', 'Accessibility checks baked in', 'Preview in Showroom automatically']
  },
  {
    status: 'Beta',
    title: 'Canvas-to-code pipelines',
    description: 'Drop Whiteboard nodes or Spec-Kit snippets to autogenerate scaffolds, stories, and visual tests.',
    bullets: ['Generates Storybook stories', 'Links acceptance criteria to tests', 'Pushes PR drafts with checklists']
  },
  {
    status: 'Planned',
    title: 'Runtime sandboxes',
    description: 'Pair Code Mixer with live data mocks and LLM pair-programming helpers.',
    bullets: ['Instant API fixtures', 'LLM co-pilot with guardrails', 'Deploy to staging Showroom']
  }
] as const;

const workflows = [
  {
    status: 'Live',
    title: 'Showroom publishing',
    description: 'Every component or layout pushed from Code Mixer registers in the Showroom index with versions and notes.',
    bullets: ['Versioned deployment cards', 'Usage analytics per component', 'One-click embed into NarcoNations.org']
  },
  {
    status: 'Beta',
    title: 'Test harness',
    description: 'Run Playwright, Lighthouse, and a11y sweeps before greenlighting a component.',
    bullets: ['ARIA + keyboard audits', 'Visual regression snapshots', 'Performance budgets tracked']
  },
  {
    status: 'Planned',
    title: 'Copywriter lane',
    description: 'Co-edit content and product copy alongside components with live persona reviews.',
    bullets: ['Tone scoring with Prompt Lab presets', 'Localization hooks ready', 'StoryBoard preview deck']
  }
] as const;

export const metadata: Metadata = {
  title: 'Code Mixer — VibeMixer',
  description: 'Blend design tokens, components, and automation to ship NarcoNations interfaces quickly and safely.'
};

export default function CodeMixerPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Code Mixer + Showroom</span>
          <h1>Build NarcoNations experiences with velocity and guardrails</h1>
          <p>
            Code Mixer fuses component libraries, Storybook tests, and Showroom publishing so Strategy Board ideas reach production
            without drift.
          </p>
          <div className="actions">
            <span className="pill">Token-driven theming</span>
            <span className="pill">Showroom sync</span>
            <span className="pill">A11y + QA sweeps</span>
          </div>
          <p className="section-subtitle">
            Assemble responsive layouts, validate accessibility, and push to Showroom with a single commit–prompt packs and tests ride
            along automatically.
          </p>
        </div>
        <div className="hero-visual hero-visual-code">
          <div className="code-window">
            <div className="code-header">
              <span className="code-dot code-dot-red" />
              <span className="code-dot code-dot-yellow" />
              <span className="code-dot code-dot-green" />
              <span className="code-title">component.tsx</span>
            </div>
            <pre>
{`export const HeroPanel = () => (
  <Panel tone=\"brand\">
    <Heading>Ops Coordinator pulse</Heading>
    <Badge status=\"beta\">Watcher sync</Badge>
  </Panel>
);`}
            </pre>
          </div>
          <div className="code-tag">Showroom snapshot ✓</div>
          <div className="code-tag code-tag-accent">A11y pass · Lighthouse 98</div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Build stack</span>
          <h2 className="section-title">Prototype, test, and publish from one console</h2>
          <p className="section-subtitle">
            Plug in design tokens, component primitives, and test harnesses. Ship to Showroom with persona sign-off.
          </p>
        </header>
        <div className="feature-card-grid">
          {stacks.map((card) => (
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
          <span className="section-eyebrow">Delivery workflow</span>
          <h2 className="section-title">Keep UX, copy, and engineering aligned</h2>
          <p className="section-subtitle">
            Every component travels from Code Mixer to Showroom, carrying documentation, prompts, and checks on the way.
          </p>
        </header>
        <div className="feature-card-grid">
          {workflows.map((card) => (
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
        <strong>Bridge to One-Shot MVP</strong>
        <p>
          When components mature, ship them straight into MVP repos—Code Mixer will wire Storybook, tests, and CI so the build team can
          focus on features.
        </p>
      </section>
    </main>
  );
}
