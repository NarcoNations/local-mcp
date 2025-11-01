# NarcoNations Local MCP — Current State, Plans, and Next Steps

## Overview

Local MCP (`mcp-nn`) is an offline research server for NarcoNations.org. It indexes documents (PDF, Markdown, TXT, Word, Pages) into a local hybrid search engine using dense embeddings and keyword search. The system ships tools for searching the corpus with precise source citations, retrieving full documents, updating the index in real time, and importing ChatGPT conversation exports for analysis. Everything runs locally to preserve privacy. A built-in control room web UI and an SSE-based API bridge let users explore the knowledge base or connect ChatGPT so it can invoke the tools as if they were plugins.

The repository is evolving toward a broader “VibeOS” knowledge and operations platform. Future phases will integrate a cloud backend (Supabase) for persistent storage, multi-user access, and automation via n8n workflows. The sections below review what is working today (Phase 1), what is planned (Phases 2 and 3), how to set it up, suggested improvements, and beginner-friendly explanations for each component and workflow.

## Phase 1: Core Local MCP (Built and Functional)

Phase 1 delivers a fully working local server:

- **Document ingestion and indexing:** Configured roots (defaults are `./docs`, `./public/dossiers`, and `./docs/chatgpt-export-md`) are scanned and chunked for indexing. Supported formats include PDF (with OCR fallback via Tesseract for scanned pages), Markdown (front-matter preserved), plain text, Word `.docx`, and Apple `.pages`. Each chunk receives a deterministic ID plus cached embedding generated with the local MiniLM model (`Xenova/all-MiniLM-L6-v2`). Vectors are stored in a flat binary index and a parallel full-text index is constructed with FlexSearch for hybrid ranking. Index data lives under `.mcp-nn` and a watcher can auto-reindex when files change.
- **MCP tools API:** The server exposes MCP tools for search and retrieval. `search_local` blends dense and keyword scores and returns results with file paths, previews, and stable citations. `get_doc` returns full text or PDF pages. Additional tools include `reindex`, `watch`, `stats`, and `import_chatgpt_export`. Inputs are validated with Zod and tools can be invoked via CLI, the web UI, or external AI agents through the SSE bridge.
- **Local CLI and server modes:** `npm run dev` launches the MCP stdio server and HTTP UI together. `npm run dev:mcp` and `npm run dev:http` run each side independently. `npm run build` transpiles to `dist` and `npm start` runs the compiled HTTP server. `npm run index -- <paths>` performs one-off reindexing and `npm run watch -- <path>` runs the watcher in a terminal session.
- **Control room UI:** The HTTP server hosts a responsive React UI at `http://localhost:3030`. Users can search, inspect results with copyable citations, view real-time index stats, trigger maintenance actions, import ChatGPT exports, and watch live activity logs streamed over SSE. The build output is Vercel friendly for deployment scenarios.
- **SSE bridge for ChatGPT:** The server advertises a manifest at `/mcp.json` and exposes `/mcp/sse` for sessions. By tunneling the local server via Cloudflare Tunnel, ngrok, or similar, ChatGPT can connect and invoke MCP tools with session tracking and live log streaming.
- **ChatGPT export ingestion:** A CLI script and MCP tool convert ChatGPT exports into Markdown files under `docs/chatgpt-export-md`, then trigger reindexing so transcripts become searchable alongside static documents. The feature is fully functional today.

Vitest coverage spans text chunking, hybrid search, PDF OCR fallback, and ChatGPT export conversion to ensure confidence. Installing Node 20+, indexing content, and running `npm run dev` gives an end-to-end local research environment with strict path whitelisting and no outbound network calls.

## Phase 2: Integrating Supabase and the Knowledge Pipeline (Planned / In Progress)

Phase 2 extends the system with cloud-backed persistence and richer automation. Supabase (Postgres + Storage) will host indexed knowledge for multi-user access. Specifications exist, and the codebase contains scaffolding, but the implementation is partial:

- **Document conversion and knowledge ingestion:** A planned pipeline will upload arbitrary document formats, call an `md-convert` worker to normalize them into Markdown plus assets, and store the output. An example Next.js adapter under `examples/nextjs` shows proxy endpoints for `/api/knowledge/manifest` and ingestion flows, including ZIP handling and Supabase Storage writes. TODOs include merging metadata into front matter before insert.
- **Knowledge base schema:** Supabase migrations define `knowledge`, `knowledge_files`, and `knowledge_embeddings` tables with a 384-dimension vector column. The intended flow inserts document metadata, saves assets, and stores chunk embeddings for pgvector-powered similarity search. Automatic syncing between local indexing and Supabase is not yet implemented.
- **Enhanced search:** Planned features add metadata filtering, date ranges, content-type scoping, and Postgres full-text search fallbacks. HTTP search endpoints currently expose basic functionality; filters and blended FTS remain roadmap items.
- **Chat conversation corpus management:** Schemas exist for conversations, messages, and tagging. Future ingestion will parse exports directly into these tables for richer queries. Current tooling still writes Markdown; database ingestion plus new API routes remain to be built.
- **API manager and LLM router:** Stubs for a multi-provider API manager (`packages/api-manager`) and LLM routing policies exist but have no functionality yet. The aim is to choose between local and cloud models per policy and normalize external data feeds.
- **UI enhancements:** Planned Next.js pages include dashboards, a timeline (Historian), prompt library views, and department dashboards. Skeletons exist; complete UIs and supporting APIs remain work-in-progress.

Phase 2 tasks fall chiefly to the Tech Syndicate, with the Ops Coordinator preparing Supabase (pgvector, storage buckets, RLS) and the Strategy Board guiding taxonomy and prioritization.

## Phase 3: Automation and Workflows (Roadmap)

Phase 3 targets orchestration and proactive operations:

- **n8n workflows:** Automate ingest, monitoring, and alerting by wiring n8n flows to MCP/Next.js endpoints. A typical flow watches for new documents, calls the converter, stores results, triggers embedding jobs, and notifies Ops on success or failure.
- **Job queue and idempotency:** Introduce a jobs table or queue service with retry logic, content hashing for deduplication, and asynchronous processing so uploads return quickly while background workers complete heavy tasks.
- **External integrations:** Extend to publishing, social media, or CMS pipelines. Conceptual stubs (e.g., social playground, publish actions) become real services handled by workflows and UI additions.
- **Persona orchestration:** Encode persona policies and prompt templates, enabling specialized AI behaviors (Strategist, Archivist, Ethics checks) once the technical plumbing is stable.

Ops will own automation and monitoring; Tech will deliver the queue mechanics and service endpoints; Strategy Board will define policies and success metrics.

## Setup and Configuration

### Phase 1 (Local Only)

1. Install Node.js 20 or newer, clone the repo, and run `npm install`.
2. Optional: run `npm run models:download` to prefetch embedding weights; set `TRANSFORMERS_OFFLINE=1` for fully offline operation.
3. First run will create `.mcp-nn/config.json` containing roots, include/exclude patterns, chunking parameters, and output directory. Edit roots or patterns as needed. Environment overrides include `MCP_NN_DATA_DIR`, `TRANSFORMERS_CACHE`, and `TRANSFORMERS_OFFLINE`.
4. Index documents with `npm run index` (or `npx tsx scripts/chatgpt-export-to-md.ts <export> <outDir>` followed by `npx tsx src/cli-index.ts <dir>` for ChatGPT transcripts).
5. Start the stack with `npm run dev` and browse `http://localhost:3030`. Use `npm run dev:mcp` or `npm run dev:http` for split modes. Production builds use `npm run build` then `npm start`.
6. For HTTPS when exposing to ChatGPT, run a tunnel (cloudflared, ngrok) pointing at port 3030. Share the tunneled `/mcp.json` and `/mcp/sse` URLs with ChatGPT.

### Phase 2 (Supabase)

1. Provision a Supabase project or Postgres with pgvector and pgcrypto enabled.
2. Apply migrations under `supabase/migrations/` to create knowledge, embeddings, conversations, messages, and events tables. Enable RLS policies to suit your auth model.
3. Create a storage bucket (default `files`). Provide `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or service key), `SUPABASE_BUCKET_FILES`, and `MD_CONVERT_URL` in the Next.js adapter `.env`. Set `INGEST_SUPABASE=true` to enable storage writes.
4. Run `npm install` and `npm run dev` inside `examples/nextjs` to start the adapter on port 3000. Test `/api/knowledge/manifest` or ingest routes with sample uploads.
5. Plan for embedding creation and knowledge table inserts after conversion; current code stops at storing files and metadata.

### Phase 3 (Automation and External Services)

1. Deploy or access an n8n instance; export and version-control workflows.
2. Integrate credentials for Supabase, MCP endpoints, and any third-party APIs (feeds, LLMs).
3. Configure workflows for ingest, monitoring, job polling, and notifications. Use webhook or cron triggers as appropriate.
4. Expand to publishing or social workflows as capabilities mature.

## Suggestions for Improvement

- **Structure:** Consider promoting the Next.js adapter and future packages to first-class directories (`apps/client`, `apps/server`, `packages/...`) to clarify boundaries.
- **Consistency:** Align tool and endpoint names between docs and code (for example, ensuring `import_chatgpt_export` matches REST route naming). Document any deviations.
- **Documentation:** Add a “Cloud Mode (Supabase)” section to the main README, include end-to-end tutorials, and translate spec-kit plans into user docs as they ship.
- **Error handling:** Ensure UI surfaces conversion or ingest failures clearly; unify JSON problem responses and SSE log entries across new APIs.
- **Modularity:** Keep upcoming modules (prompt library, LLM router, persona policies) isolated so teams can iterate without regressions elsewhere.
- **Naming:** Maintain clear, ASCII-friendly filenames and avoid ambiguous resource names in databases. Consider namespacing tables if more domains emerge.
- **Performance:** Monitor index size; expose configuration to switch between local vector storage and pgvector-backed search when scaling.
- **Testing and CI:** Introduce GitHub Actions for lint/typecheck/test/build, and add integration tests for Supabase paths plus UI snapshots.
- **Security:** Harden CORS and auth for deployed APIs, document API key requirements, and audit new endpoints before exposing them beyond localhost.

## Component and Workflow Primer

- **MCP server and tools:** A Node service exposing standardized JSON tools via MCP. Tools like `search_local`, `get_doc`, and `reindex` execute on the local index and return structured results for AIs or the UI.
- **Indexing workflow:** Files are parsed, chunked, embedded, and stored in both vector and keyword indexes. Searches blend both scores for relevant citations. A watcher keeps indexes in sync.
- **Control room UI:** A React dashboard talking to `/api/*` endpoints and SSE log streams, offering searches, stats, maintenance actions, and import helpers.
- **Supabase knowledge base:** Cloud storage plus pgvector tables storing documents, assets, and embeddings. Envisions shared access, metadata tagging, and SQL-powered queries.
- **Historian (event logging):** Persisted event records and SSE streams capturing ingest, search, and system activity for audit trails and dashboards.
- **n8n automation:** Visual workflows handling ingest, monitoring, and integrations. Replace manual multi-step tasks with orchestrated jobs and alerts.
- **Prompt library and research engine (roadmap):** Future modules for managing prompt templates, comparing model outputs, and orchestrating multi-step research plans.
- **Personas and team modes:** Organizational framing for ownership and future AI behaviors (Tech Syndicate, Ops Coordinator, Strategy Board). Guides feature prioritization and interface design.

## Next Steps

1. **Phase 1 polish:** Fix outstanding bugs, refine documentation, and encourage Ops to run the local stack daily.
2. **Phase 2 delivery:** Implement Supabase ingestion and syncing, expand API filters, and ship initial dashboard enhancements.
3. **Prompt and LLM work:** Start building the prompt library and LLM routing policies in parallel so teams can experiment early.
4. **Phase 3 planning:** Design n8n workflows, agree on job queue semantics, and define operational alerts.
5. **Strategy alignment:** Finalize tagging taxonomy, logging requirements, and dashboard KPIs with the Strategy Board.
6. **Feedback loop:** Gather user feedback, monitor performance, and iterate on UI/UX as data and workflows scale.

This document captures the current state of the NarcoNations Local MCP project, the planned evolution toward VibeOS, and guidance for teammates onboarding to the stack.
