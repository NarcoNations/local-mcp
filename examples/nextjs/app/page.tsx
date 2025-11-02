import { SectionCard } from '@/components/SectionCard';
import { MetricTile } from '@/components/MetricTile';
import { PersonaCard } from '@/components/PersonaCard';

const llmSmokeTest = {
  task: 'System smoke test',
  prompt: 'Summarise how VibeMixer keeps NarcoNations knowledge in sync across edge and cloud.'
};

const metrics = [
  { label: 'Knowledge items', value: '1,248', meta: 'docs, dossiers, chat transcripts' },
  { label: 'Embeddings cached', value: '58k', meta: 'MiniLM vectors ready for hybrid search' },
  { label: 'Automation flows', value: '12', meta: 'n8n jobs + scheduled sync tasks' },
  { label: 'Live personas', value: '9', meta: 'Strategy, Ops, Research, Build crews' }
] as const;

const knowledgeOps = [
  {
    title: 'Supabase manifest sync',
    badge: 'Knowledge',
    status: 'live',
    description: 'Pull the latest cloud mirror of the NarcoNations corpus, including document metadata and embeddings summary.',
    actionLabel: 'Load manifest',
    endpoint: '/api/knowledge/manifest',
    footnote: 'Uses Supabase storage + pgvector mirror.'
  },
  {
    title: 'Index health snapshot',
    badge: 'Storage',
    status: 'beta',
    description: 'Check table counts, chunk freshness, and vector cache age to ensure the ingestion loop is healthy.',
    actionLabel: 'Run health pulse',
    endpoint: '/api/knowledge/pulse'
  },
  {
    title: 'Chat corpus sync',
    badge: 'Historian',
    status: 'beta',
    description: 'Preview the Historian ingest that normalises ChatGPT exports into tagged conversations for analysis.',
    actionLabel: 'Preview chat atlas',
    endpoint: '/api/knowledge/chats',
    footnote: 'Historian v1 schema; full UI shipping in Phase 2.'
  }
] as const;

const researchEngine = [
  {
    title: 'Research engine plan',
    badge: 'Research',
    status: 'beta',
    description: 'Generate a structured research brief with facts, insights, and suggested follow-ups from the local corpus.',
    actionLabel: 'Draft plan',
    endpoint: '/api/research/plan',
    method: 'POST',
    body: { query: 'Port security and narcotics smuggling corridors' }
  },
  {
    title: 'Ideas Lab synthesis',
    badge: 'Ideas',
    status: 'planned',
    description: 'Blend Strategy Board prompts with live corpus intel to surface campaign angles and narrative beats.',
    actionLabel: 'Run synthesis',
    endpoint: '/api/research/ideas'
  },
  {
    title: 'Fact pack generator',
    badge: 'Briefing',
    status: 'planned',
    description: 'Assemble executive-style briefs with citations, ready for StoryBoard and Showroom drops.',
    actionLabel: 'Assemble pack',
    endpoint: '/api/research/factpack'
  }
] as const;

const promptLibrary = [
  {
    title: 'Prompt library snapshot',
    badge: 'Prompt Lab',
    status: 'beta',
    description: 'Inspect saved prompts, tone presets, and evaluation history across local + cloud LLMs.',
    actionLabel: 'List prompts',
    endpoint: '/api/prompts/library'
  },
  {
    title: 'AB test harness',
    badge: 'Optimization',
    status: 'planned',
    description: 'Queue comparative runs across router policies to tune for cost, latency, and tone.',
    actionLabel: 'Queue experiment',
    endpoint: '/api/prompts/experiments'
  },
  {
    title: 'Persona prompt packs',
    badge: 'Persona',
    status: 'planned',
    description: 'Preview tailored prompt packs for Strategy Board, Ops, Marketing Ops, and Ethics review.',
    actionLabel: 'Preview packs',
    endpoint: '/api/prompts/personas'
  }
] as const;

const automationOps = [
  {
    title: 'Ingest pipeline monitor',
    badge: 'Automation',
    status: 'beta',
    description: 'Review the n8n flow status for document conversion, Supabase sync, and vector enrichment.',
    actionLabel: 'Check pipelines',
    endpoint: '/api/automation/pipeline'
  },
  {
    title: 'Deployment checklist',
    badge: 'DevOps',
    status: 'planned',
    description: 'Run preflight checks for Vercel deploys, Supabase migrations, and model cache hydration.',
    actionLabel: 'Run checklist',
    endpoint: '/api/automation/checklist'
  },
  {
    title: 'Social Playground queue',
    badge: 'Comms',
    status: 'planned',
    description: 'Preview scheduled drops for social + newsletter channels, sourced from the Research Engine.',
    actionLabel: 'Open queue',
    endpoint: '/api/playgrounds/social'
  }
] as const;

const timeline = [
  {
    phase: 'Now shipping',
    title: 'Phase 1 · Local MCP Control Room',
    detail: 'Hybrid search, chat export ingestion, and SSE bridge are stable for day-to-day ops.'
  },
  {
    phase: 'In progress',
    title: 'Phase 2 · Supabase knowledge cloud',
    detail: 'Document conversion pipeline, pgvector sync, and responsive dashboard in active development.'
  },
  {
    phase: 'Queued',
    title: 'Phase 3 · Automation + Persona orchestration',
    detail: 'n8n automation lattice, Social Playground, and persona-driven prompt routing enter build next.'
  }
] as const;

const personas = [
  {
    name: 'Tech Syndicate',
    role: 'Build squad',
    focus: 'Ships MCP features, adapters, and infra glue.',
    bullets: ['Maintain VibeMixer surfaces', 'Own Supabase + API bridge', 'Guardrail model router + tests']
  },
  {
    name: 'Ops Coordinator',
    role: 'Automation',
    focus: 'Keeps ingestion, n8n jobs, and observability humming.',
    bullets: ['Curate ingestion flows', 'Watch Historian feeds', 'Manage secrets + runbooks']
  },
  {
    name: 'Strategy Board',
    role: 'Direction',
    focus: 'Sets campaign intent, prompt tone, and KPI dashboards.',
    bullets: ['Author prompt packs', 'Prioritise research briefs', 'Sign off on persona policies']
  },
  {
    name: 'Ideas Lab',
    role: 'Creative R&D',
    focus: 'Explores narratives, hooks, and experiential builds.',
    bullets: ['Prototype StoryBoard drops', 'Feed Social Playground', 'Pair with Research Engine']
  },
  {
    name: 'Historian',
    role: 'Memory',
    focus: 'Archives events, chat transcripts, and knowledge provenance.',
    bullets: ['Tag chat corpus', 'Generate time-lined recaps', 'Surface anomalies to Ops']
  },
  {
    name: 'Ethics + Safety',
    role: 'Review',
    focus: 'Ensures outputs align with NarcoNations guardrails.',
    bullets: ['Audit automation flows', 'Review prompt changes', 'Flag data governance gaps']
  }
] as const;

export default function Page() {
  return (
    <main>
      <section className="hero hero-layout">
        <div className="hero-copy">
          <span className="tagline">VibeMixer — NarcoNations Ops Surface</span>
          <h1>Unify the MCP, Supabase, and automation stack</h1>
          <p>
            VibeMixer is the cinematic cockpit for NarcoNations: preview cloud syncs, stress-test research engines, tune prompt
            libraries, and line up automation runs from one adaptive control surface.
          </p>
          <div className="actions">
            <span className="pill">Local MCP</span>
            <span className="pill">Supabase Cloud</span>
            <span className="pill">n8n Automations</span>
            <span className="pill">Persona Playbooks</span>
          </div>
          <ul className="hero-highlights">
            {heroHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit">
            <div className="orbit-ring orbit-ring-lg" />
            <div className="orbit-ring orbit-ring-md" />
            <div className="orbit-core">
              <span className="orbit-title">MCP</span>
              <span className="orbit-sub">edge intelligence</span>
            </div>
            <div className="orbit-node orbit-node-top">
              <span>Supabase Cloud</span>
            </div>
            <div className="orbit-node orbit-node-right">
              <span>Research Engine</span>
            </div>
            <div className="orbit-node orbit-node-bottom">
              <span>Prompt Lab</span>
            </div>
            <div className="orbit-node orbit-node-left">
              <span>Automation</span>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Knowledge Ops</span>
          <h2 className="section-title">Sync the NarcoNations corpus across edge + cloud</h2>
          <p className="section-subtitle">
            Validate Supabase mirrors, watch Historian ingest, and keep the research corpus hydrated with PDFs, dossiers, and chat logs.
          </p>
        </header>
        <div className="dashboard-grid">
          {knowledgeOps.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Research Engine</span>
          <h2 className="section-title">Plan investigations and generate narrative-ready intelligence</h2>
          <p className="section-subtitle">
            Run playbooks that blend hybrid search, summarisation, and persona prompts to accelerate campaign design.
          </p>
        </header>
        <div className="dashboard-grid">
          {researchEngine.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Prompt Lab</span>
          <h2 className="section-title">Curate tone, prompts, and router policies</h2>
          <p className="section-subtitle">
            Track prompt performance, prepare persona packs, and stage A/B runs across local and cloud models before deploying.
          </p>
        </header>
        <div className="dashboard-grid">
          {promptLibrary.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Automation & Ops</span>
          <h2 className="section-title">Keep ingestion, publishing, and social loops on rails</h2>
          <p className="section-subtitle">
            Ops can inspect n8n pipelines, prep deployment checklists, and preview outbound content queues before they go live.
          </p>
        </header>
        <div className="dashboard-grid">
          {automationOps.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Roadmap Pulse</span>
          <h2 className="section-title">Where VibeMixer is heading</h2>
          <p className="section-subtitle">
            Track the phased rollout from local MCP mastery to full VibeOS automation and persona orchestration.
          </p>
        </header>
        <div className="timeline">
          {timeline.map((event) => (
            <article className="timeline-item" key={event.title}>
              <span className="timeline-meta">{event.phase}</span>
              <h3 className="timeline-title">{event.title}</h3>
              <p className="persona-focus">{event.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-eyebrow">Persona Squads</span>
          <h2 className="section-title">The teams powering VibeMixer</h2>
          <p className="section-subtitle">
            Each squad owns part of the stack. Combine their playbooks to keep NarcoNations research, production, and outreach aligned.
          </p>
        </header>
        <div className="persona-grid">
          {personas.map((persona) => (
            <PersonaCard key={persona.name} {...persona} />
          ))}
        </div>
      </section>

      <footer>
        Need deployment steps? Read the Supabase guide in <a href="../../docs/supabase.md">docs/supabase.md</a> for environment,
        migrations, and Vercel hints. Track the build roadmap in <a href="../../docs/narconations-local-mcp.md">narconations-local-mcp.md</a>.
      </footer>
    </main>
  );
}
