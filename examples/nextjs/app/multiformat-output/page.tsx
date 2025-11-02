import type { Metadata } from 'next';

const transformers = [
  {
    status: 'Live soon',
    title: 'Deck & briefing generator',
    description: 'Convert research summaries into executive decks, ops briefs, and storytelling outlines.',
    bullets: ['Supports PDF, Keynote, Markdown', 'Pulls imagery from Showroom', 'Auto-citations appended']
  },
  {
    status: 'Beta',
    title: 'Social copy bundles',
    description: 'Create multi-channel copy packs for Social Playground, newsletters, and press releases.',
    bullets: ['Tone knobs per persona', 'A/B copy slots', 'Exports to Social queue']
  },
  {
    status: 'Planned',
    title: 'Interactive article builder',
    description: 'Generate NarcoNations.org-ready longform pieces combining narrative, stats, and interactive embeds.',
    bullets: ['Pulls charts from Supabase', 'Includes Crime-Map layers', 'Publishes via Code Mixer components']
  }
] as const;

const workflows = [
  {
    status: 'Live',
    title: 'Prompt Lab integration',
    description: 'Each transformer uses curated prompt packs and logs results for evaluation.',
    bullets: ['Prompt version stamped', 'LLM router heuristics applied', 'Feedback to Prompt Lab']
  },
  {
    status: 'Beta',
    title: 'Persona review loops',
    description: 'Strategy Board, Ops, and Ethics can review and approve outputs before release.',
    bullets: ['Inline comments', 'Approval deadlines', 'Historian audit trails']
  },
  {
    status: 'Planned',
    title: 'Distribution triggers',
    description: 'Automatically push approved assets into n8n flows, Vercel deploys, or partner channels.',
    bullets: ['Webhook integrations', 'Pre-flight checklists', 'Scheduling with Social Playground']
  }
] as const;

export const metadata: Metadata = {
  title: 'Multi-format Output — VibeMixer',
  description: 'Transform NarcoNations intelligence into briefs, decks, social scripts, and interactive stories.'
};

export default function MultiFormatOutputPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Multi-format Output Transformer</span>
          <h1>Ship NarcoNations stories across every channel</h1>
          <p>
            Feed Research Engine results or Prompt Lab macros to generate decks, briefs, and social bundles ready for distribution—
            complete with citations and approvals.
          </p>
          <div className="actions">
            <span className="pill">Decks</span>
            <span className="pill">Briefings</span>
            <span className="pill">Social packs</span>
          </div>
          <p className="section-subtitle">
            Use tone presets and citations to turn raw intelligence into polished deliverables for execs, partners, and the public.
          </p>
        </div>
        <div className="hero-visual hero-visual-multiform">
          <div className="output-card output-card-deck">
            <span className="output-label">Deck</span>
            <strong>Port Vigil slide 04</strong>
            <p>Hybrid search summary with citations + Showroom imagery.</p>
          </div>
          <div className="output-stack">
            <div className="output-chip">Exec brief.pdf</div>
            <div className="output-chip output-chip-alt">Ops checklist.md</div>
            <div className="output-chip">Social thread.txt</div>
          </div>
          <div className="output-note">Exports: Keynote · Markdown · Social Playground queue</div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Transformers</span>
          <h2 className="section-title">Choose the right output for each mission</h2>
          <p className="section-subtitle">
            Mix tone presets with structured research to create assets tailored to Strategy, Ops, or public storytelling.
          </p>
        </header>
        <div className="feature-card-grid">
          {transformers.map((card) => (
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
          <span className="section-eyebrow">Workflows</span>
          <h2 className="section-title">Keep outputs aligned and accountable</h2>
          <p className="section-subtitle">
            Prompt Lab, persona reviews, and automation triggers ensure every asset stays on-brand and fully tracked.
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
        <strong>One pipeline, many channels</strong>
        <p>
          Soon you&apos;ll be able to route a single research brief into decks, podcasts, newsletters, and map stories automatically.
          Multi-format Transformer is the glue.
        </p>
      </section>
    </main>
  );
}
