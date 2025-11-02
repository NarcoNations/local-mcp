import type { Metadata } from 'next';
import { CrimeMapVisual } from '@/components/CrimeMapVisual';

const features = [
  {
    status: 'Live soon',
    title: 'Map layers',
    description: 'Render seizures, supply corridors, and socio-economic overlays powered by MapLibre + PMTiles.',
    bullets: ['Offline tiles for field use', 'Layer presets per persona', 'Embed into NarcoNations.org']
  },
  {
    status: 'Beta',
    title: 'Narrative annotations',
    description: 'Attach story beats, interviews, and Historian excerpts to map regions.',
    bullets: ['Timeline slider', 'Multimedia attachments', 'Export to Showroom scenes']
  },
  {
    status: 'Planned',
    title: 'Scenario simulator',
    description: 'Model interdiction operations or policy changes with tunable parameters.',
    bullets: ['What-if dashboards', 'Ops playbook integration', 'Publish outcomes to Research Engine']
  }
] as const;

const pipelines = [
  {
    status: 'Live',
    title: 'Data ingest',
    description: 'API Manager feeds daily stats; Archivist normalises them; embeddings keep queries fast.',
    bullets: ['Supabase storage + vector sync', 'Historian event logging', 'Automated dedupe + QA']
  },
  {
    status: 'Beta',
    title: 'Story export',
    description: 'Generate map-based explainers for Social Playground and Showroom.',
    bullets: ['Multi-format output pipeline', 'Prompt Lab tone presets', 'Versioning for revisions']
  },
  {
    status: 'Planned',
    title: 'Field kit',
    description: 'Offline bundle for Ops teams with cached layers and note-taking.',
    bullets: ['Sync back when online', 'Persona-specific presets', 'Security-scoped data access']
  }
] as const;

export const metadata: Metadata = {
  title: 'Crime-Map Playground — VibeMixer',
  description: 'Visualise NarcoNations intelligence with geospatial layers, annotations, and scenario planning.'
};

export default function CrimeMapPage() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">Crime-Map Playground</span>
          <h1>Tell powerful stories with maps and data overlays</h1>
          <p>
            Blend seizure data, logistics intel, and narrative annotations into a cinematic map studio ready for campaigns and ops
            planning.
          </p>
          <div className="actions">
            <span className="pill">MapLibre</span>
            <span className="pill">Narratives</span>
            <span className="pill">Simulation</span>
          </div>
          <p className="section-subtitle">
            Layer interdiction heatmaps with Historian insights, annotate emerging shell networks, and export interactive stories
            straight to Social Playground.
          </p>
        </div>
        <CrimeMapVisual />
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Features</span>
          <h2 className="section-title">Visualise intelligence with cinematic polish</h2>
          <p className="section-subtitle">
            Ready-to-use layers, story annotations, and interactive simulations keep Strategy Board and Ops in sync.
          </p>
        </header>
        <div className="feature-card-grid">
          {features.map((card) => (
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
          <h2 className="section-title">Data in, stories out</h2>
          <p className="section-subtitle">
            From API ingestion to campaign-ready map stories, the pipeline keeps the Crime-Map Playground fresh and reliable.
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
        <strong>Designed for storytelling</strong>
        <p>
          Expect templated overlays for documentaries, social snippets, and interactive explainers. Crime-Map Playground makes the data
          personal.
        </p>
      </section>
    </main>
  );
}
