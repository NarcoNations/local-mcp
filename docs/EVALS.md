# Eval Lab — Datasets & Leaderboards

The Eval Lab provides a low-cost way to benchmark prompts or models before pushing updates to production jobs.

## Feature Flag

- Set `FF_EVALS=true` to enable `/evals` UI and `/api/evals/run` endpoint.

## Datasets

- Datasets live in `examples/next-adapter/lib/evals/datasets.ts`.
- Each dataset contains an `id`, `name`, `description`, and `samples` array (`prompt`, `expected`).
- Add new entries under the `// EDIT HERE` block and redeploy.

## Running Evaluations

- POST `/api/evals/run` with payload:
  ```json
  {
    "datasetId": "baseline-copy",
    "models": ["gpt-4o-mini", "local:mock"]
  }
  ```
- The router calls `runLLM` for each sample and model, recording metrics in `eval_runs`.
- Metrics include accuracy (exact match), coverage, average latency, and average length delta.

## Leaderboard UI

- `/evals` exposes dataset selection, model entry (comma separated), run button, and leaderboard cards.
- Results persist to Supabase so repeat visits show the latest runs.

## Historian & Audit

- Every run emits `eval.completed` events and records an audit entry.
- Use these signals to gate deploys or trigger follow-up jobs.
