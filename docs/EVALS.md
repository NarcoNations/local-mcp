# Eval Lab — Defining Datasets & Running Leaderboards

Eval Lab (v1) lets producers benchmark prompts + models through `/evals`.

## Datasets

- Table: `evals` with fields `id`, `name`, `type`, `dataset_ref`, `created_at`.
- Store dataset fixtures (JSON/CSV) in Supabase Storage or embed path references.
- `DATASET_FIXTURE` in `/app/api/evals/run/route.ts` is a stub — replace with actual dataset loader (// EDIT HERE marker).

## Running Evaluations

1. Enable `FF_EVALS=true`.
2. Generate API key with `llm:*` scope.
3. Use the Eval Lab UI (`/evals`) or POST directly:

```
POST /api/evals/run
Headers: x-api-key: <key>
Body: {
  "eval_id": "eval-1",
  "models": ["gpt-4.1-mini", "claude-3-haiku"],
  "prompt_id": "prompt-hero"
}
```

The route simulates metrics until the router integration lands. Replace `simulateMetrics` with live calls through the LLM router.

## Metrics Schema

- Table: `eval_runs` — `id`, `eval_id`, `model`, `prompt_id`, `started_at`, `finished_at`, `metrics JSONB`.
- Populate metrics with BLEU-style exactness, latency, output length, plus optional judge scores.
- Leaderboard sorts by `judge_score`. Adjust `rankRuns` in `lib/evals.ts` to reflect your scoring rubric.

## Shadow Testing & Automation

- Schedule nightly evals by calling `/api/evals/run` from Vercel Cron.
- Pipe results to `/metrics` dashboards or external BI via `/api/metrics.json`.
- Extend to regression gating: block deploys when metrics degrade beyond thresholds.
