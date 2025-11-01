import { SectionCard } from '@/components/SectionCard';

const llmSmokeTest = {
  task: 'System smoke test',
  prompt: 'Summarise how this Next.js dashboard connects Supabase to the MCP knowledge store in one upbeat sentence.'
};

export default function Page() {
  return (
    <main>
      <section className="hero">
        <h1>Supabase + MCP control panel</h1>
        <p>
          Deploy-ready blueprint for syncing the Local MCP knowledge graph into Supabase, testing the production API manager, and
          validating storage health from a responsive Next.js surface tuned for Vercel.
        </p>
      </section>
      <section className="dashboard-grid">
        <SectionCard
          title="Run production API manager"
          badge="LLM"
          description="Calls @vibelabz/api-manager → OpenAI. If you see a completion the shared workspace plumbing is healthy."
          actionLabel="Run live prompt"
          endpoint="/api/llm"
          method="POST"
          body={llmSmokeTest}
        />
        <SectionCard
          title="Fetch Supabase manifest"
          badge="Knowledge"
          description="Loads the JSON manifest stored by the Supabase-backed knowledge store."
          actionLabel="Load manifest"
          endpoint="/api/knowledge/manifest"
        />
        <SectionCard
          title="Storage health snapshot"
          badge="Storage"
          description="Returns counts and last indexed timestamp to confirm the tables and embeddings are reachable."
          actionLabel="Check summary"
          endpoint="/api/knowledge/manifest?summary=1"
        />
      </section>
      <footer>
        Need deployment steps? Read the Supabase guide in <a href="../../docs/supabase.md">docs/supabase.md</a> for environment,
        migrations, and Vercel hints.
      </footer>
    </main>
  );
}
