import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const lanes = [
  { name: 'Ingest → Convert → Index', description: 'Files, conversations, archives.', href: '/api/ingest/convert', status: 'queue healthy' },
  { name: 'Embeddings + Search', description: 'Vector (MiniLM) + FTS fallback.', href: '/search', status: 'running' },
  { name: 'LLM Router', description: 'Policy-based provider switching.', href: '/api/llm/run', status: 'adaptive' },
  { name: 'Research Engine', description: 'Plan, notes, insights, exports.', href: '/research', status: 'pilot' }
];

const quickActions = [
  { title: 'Launch Historian', href: '/timeline', detail: 'View timeline + metrics' },
  { title: 'Draft Market Brief', href: '/library/prompts', detail: 'Prompt library + scoring' },
  { title: 'Spin up Strategy Board', href: '/dept/strategy-board', detail: 'War-room briefs' },
  { title: 'Sync MCP Adapter', href: '/api/mcp/narconations/index', detail: 'Narco Nations endpoints' }
];

const kpis = [
  { label: 'Knowledge Assets', value: '1,284', delta: '+18 this week' },
  { label: 'LLM Runs (24h)', value: '92', delta: '-12 vs avg' },
  { label: 'Cache Hit Rate', value: '76%', delta: '↑ 8% after Supabase sync' },
  { label: 'Jobs Queued', value: '7', delta: '2 embed · 3 convert · 2 publish' }
];

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 pt-12 lg:px-12 xl:gap-14 xl:pt-16">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
        <Card className="p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge tone="accent">Phase 2 — Live</Badge>
            <span className="text-sm text-text-muted">Built to merge with Phase 1 + UI M1</span>
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight text-text sm:text-4xl">
            Ultimate OS Dashboard for Narco Nations — orchestrating ingest, knowledge, research, and action.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-text-muted md:text-lg">
            All pipelines operate under a clean token-first system. Background jobs, Historian observability, and free-tier APIs keep the stack deployable on Vercel & Supabase without paid tiers.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/research">Run a Research Mission</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/library/prompts">Open Prompt Library</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/metrics">View Metrics</Link>
            </Button>
          </div>
        </Card>
        <Card variant="surface" className="relative flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold text-text">Free-tier Pipeline KPIs</h2>
            <p className="text-sm text-text-muted">Auto-refresh via Supabase edge functions every 15 minutes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-border/50 bg-surface-muted/70 p-4">
                <p className="text-xs uppercase tracking-wide text-text-muted">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold text-text">{kpi.value}</p>
                <p className="mt-1 text-xs text-text-muted">{kpi.delta}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => (
          <Card key={lane.name} variant="surface" className="flex flex-col justify-between gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text">{lane.name}</h3>
                <p className="mt-2 text-sm text-text-muted">{lane.description}</p>
              </div>
              <Badge tone="accent">{lane.status}</Badge>
            </div>
            <Link className="text-sm font-semibold text-accent" href={lane.href}>
              Inspect
            </Link>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text">Mission Control</h2>
            <Badge tone="default">Updated live</Badge>
          </div>
          <ul className="grid gap-3 text-sm text-text-muted">
            <li className="rounded-xl border border-border/60 bg-surface-muted/70 px-4 py-3">
              Background jobs orchestrate convert → embed → index with Supabase persistence and n8n hand-off ready webhooks.
            </li>
            <li className="rounded-xl border border-border/60 bg-surface-muted/70 px-4 py-3">
              LLM Router enforces cost/latency guardrails, routes to local MiniLM when hints request local or providers fail.
            </li>
            <li className="rounded-xl border border-border/60 bg-surface-muted/70 px-4 py-3">
              Historian retains event meta with retention policies; metrics compute ingest/day, cache hit rate, and LLM spend.
            </li>
          </ul>
        </Card>
        <Card variant="surface" className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-surface-muted/70 px-4 py-3 text-sm transition-colors hover:border-accent/40 hover:bg-surface-strong/60"
              >
                <span>
                  <span className="block font-semibold text-text">{action.title}</span>
                  <span className="text-xs text-text-muted">{action.detail}</span>
                </span>
                <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.6fr)]">
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Departments on Deck</h2>
          <p className="text-sm text-text-muted">Direct links to the departmental dashboards powering Narco Nations campaigns.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="rounded-2xl border border-border/60 bg-surface-muted/70 px-4 py-4 text-sm hover:border-accent/50" href="/dept/sales">
              Sales Command
            </Link>
            <Link className="rounded-2xl border border-border/60 bg-surface-muted/70 px-4 py-4 text-sm hover:border-accent/50" href="/dept/marketing">
              Marketing Pulse
            </Link>
            <Link className="rounded-2xl border border-border/60 bg-surface-muted/70 px-4 py-4 text-sm hover:border-accent/50" href="/dept/manufacturing">
              Manufacturing Ops
            </Link>
            <Link className="rounded-2xl border border-border/60 bg-surface-muted/70 px-4 py-4 text-sm hover:border-accent/50" href="/dept/ideas-lab">
              Ideas Lab
            </Link>
          </div>
        </Card>
        <Card variant="surface" className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Supabase + Vercel Ready</h2>
          <p className="text-sm text-text-muted">
            Clean environment variable guardrails ensure Vercel builds succeed with or without optional services. Every API validates payloads with Zod and surfaces structured errors.
          </p>
          <ul className="grid gap-3 text-sm text-text-muted">
            <li>Supabase caching &amp; job queue degrade gracefully to memory store.</li>
            <li>Embeddings via Xenova MiniLM run inside background workers or inline for dev.</li>
            <li>Rate limiting and CORS policies guard free-tier API usage.</li>
          </ul>
        </Card>
        <Card variant="accent" className="flex flex-col gap-4 text-text">
          <h2 className="text-xl font-semibold">Narco Nations MCP Adapters</h2>
          <p className="text-sm text-text/80">
            `.com` and `.org` connectors expose index/search/publish actions with API key gating. Conversion uses md-convert pipeline and knowledge storage with provenance.
          </p>
          <Button asChild variant="secondary">
            <Link href="/api/mcp/narconations/index">Read API spec</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
