# Test coverage audit

## Existing suites prior to this update

| Suite | Scope | Notes |
| --- | --- | --- |
| `tests/smoke.test.ts` | Harness smoke test | Validates the Vitest runner only; no assertions on behaviour. |
| `tests/chunk.test.ts` | `pipeline/chunk.ts` | Exercises chunk sizing and metadata retention. No integration with storage or retrieval layers. |
| `tests/vector-flat.test.ts` | `store/vector-flat.ts` | Confirms vector insertion/search for the in-memory flat index. Does not cover manifest persistence, reindex flow, or keyword search. |
| `tests/chatgpt.convert.test.ts` | `utils/chatgpt.ts` | Focuses on markdown conversion for ChatGPT exports. |

## Coverage gaps that previously existed

- **HTTP/SSE surface area** – none of the `/api/*`, `/mcp/*`, or log streaming endpoints were validated. Error handling, log propagation, and SSE behaviour were untested.
- **Store/index lifecycle** – no integration exercised `KnowledgeStore` across disk persistence, reindexing, manifest updates, or hybrid search surfaces.
- **Control Room UI responsiveness** – there were no automated UI checks, so regressions in responsive breakpoints or layout sizing could ship unnoticed.
- **Script coverage** – `npm test` only ran Vitest. There was no way to validate browser automation or integration suites in CI.

## New suites introduced in this change

- `tests/integration/http.integration.test.ts` – Vitest integration coverage for REST endpoints and log streaming, including success and failure pathways.
- `tests/integration/store.integration.test.ts` – integration coverage for the `KnowledgeStore` reindex/update flows with deterministic embeddings.
- `tests/e2e/control-room.spec.ts` – Playwright checks for responsive layout across mobile and large-screen viewports.

## Remaining opportunities

- Expand SSE coverage to assert full MCP handshake and message exchange using a lightweight client stub.
- Add regression tests for additional file type indexers (PDF, DOCX, Pages) once fixtures are available.
- Instrument CI with coverage reporting (e.g. `vitest --coverage`) to quantify statements/branches exercised by unit and integration suites.

