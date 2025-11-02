import type { Metadata } from 'next';

const capabilities = [
  {
    status: 'Live',
    title: 'Multi-source ingestion',
    description: 'Collate documents from docs/, dossiers, chat exports, and partner feeds with dedupe and metadata enrichment.',
    bullets: ['md-convert pipeline', 'Supabase Storage mirror', 'Checksum + provenance tracking']
  },
  {
    status: 'Beta',
    title: 'Smart tagging',
    description: 'Apply Strategy Board taxonomies, persona tags, and risk markers automatically.',
    bullets: ['Tag suggestions from Historian', 'Ops priority scoring', 'Link to Research Engine contexts']
  },
  {
    status: 'Planned',
    title: 'Vault sync',
    description: 'Push curated collections to Obsidian, Notion, or external partners via permissioned links.',
    bullets: ['Access-controlled exports', 'Diff alerts on updates', 'Timeline entries for share events']
  }
] as const;

const maintenance = [
  {
    status: 'Live soon',
    title: 'Retention policies',
    description: 'Apply retention windows per collection and emit alerts before archival or deletion.',
    bullets: ['Configurable per folder', 'Historian audit record', 'Ops overrides with approvals']
  },
  {
    status: 'Beta',
    title: 'Integrity scanner',
    description: 'Monitor for broken links, outdated embeds, or missing assets across the corpus.',
    bullets: ['Nightly n8n job', 'Diff summary emails', 'Prompt to regenerate embeddings']
  },
  {
    status: 'Planned',
    title: 'Ai-assisted summarisation',
    description: 'Generate knowledge cards and timeline-ready summaries as new material lands.',
    bullets: ['links to Prompt Lab macros', 'Auto attaches to Showroom content', 'Feeds Social Playground ideas']
  }
] as const;

export const metadata: Metadata = {
  title: 'Archivist — VibeMixer',
  description: 'Ingest, organise, and maintain NarcoNations knowledge sources with provenance and automation.'
};

export default function ArchivistPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Archivist & File Manager</span>
          <h1>Keep the NarcoNations knowledge vault pristine</h1>
          <p>
            Archivist unifies ingestion, tagging, and retention policies so every document, chat, and asset is ready for Research Engine,
            Prompt Lab, and Social Playground.
          </p>
          <div className="actions">
            <span className="pill">Ingestion</span>
            <span className="pill">Tagging</span>
            <span className="pill">Retention</span>
          </div>
          <p className="section-subtitle">
            Sync folders, chat exports, and partner feeds into a single vault with provenance, retention, and anomaly alerts built in.
          </p>
        </div>
        <div className="hero-visual hero-visual-archivist">
          <div className="archive-stack">
            <div className="archive-folder archive-folder-top">
              <span>docs/ dossiers/</span>
            </div>
            <div className="archive-folder archive-folder-mid">
              <span>chatgpt-export-md/</span>
            </div>
            <div className="archive-folder archive-folder-bottom">
              <span>partner-feeds.zip</span>
            </div>
            <div className="archive-tab">Checksum ✓</div>
            <div className="archive-tab archive-tab-right">Tagged · Historian logged</div>
          </div>
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Capabilities</span>
          <h2 className="section-title">All knowledge streams in one orbit</h2>
          <p className="section-subtitle">
            Archivist ensures every piece of content flows into Supabase, vectors, and Historian with the metadata teams need.
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
          <span className="section-eyebrow">Maintenance</span>
          <h2 className="section-title">Automate trust and hygiene</h2>
          <p className="section-subtitle">
            Run continual checks so VibeMixer always has clean inputs. Retention, integrity, and summaries keep Ops ahead.
          </p>
        </header>
        <div className="feature-card-grid">
          {maintenance.map((card) => (
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
        <strong>Transparency baked in</strong>
        <p>
          Every ingest and retention event streams to Historian, making compliance reviews trivial. Expect dashboards soon under the
          Ops timeline.
        </p>
      </section>
    </main>
  );
}
