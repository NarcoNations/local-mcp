# Next.js + Supabase production sample

This example ships a Vercel-ready dashboard that:

- syncs the Local MCP knowledge store with Supabase using the new migrations,
- calls the production `@vibelabz/api-manager` to smoke-test LLM credentials, and
- visualises Supabase knowledge metadata from responsive UI components.

## Quickstart

```bash
cd examples/nextjs
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` to trigger the cards:

1. **Run production API manager** — proxies through `@vibelabz/api-manager` to OpenAI. Returns an error if `OPENAI_API_KEY` is missing.
2. **Fetch Supabase manifest** — reads the `knowledge_manifests` table using the service-role key.
3. **Storage health snapshot** — returns aggregated chunk/file counts so you can confirm embeddings and namespace wiring.

## Deployment tips

- Works out of the box on Vercel. Ensure the following environment variables are present in the project settings:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_KNOWLEDGE_NAMESPACE` (defaults to `default`)
  - `OPENAI_API_KEY`
- If you need client-side Supabase access, also configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Build command: `npm run build`. Output is the standard Next.js serverless runtime.

More context and deployment guidance lives in [`../../docs/supabase.md`](../../docs/supabase.md).
