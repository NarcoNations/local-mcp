# Eval Lab — Model & Prompt Evaluations

## Schema

Create two tables:

```sql
create table evals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  dataset_ref text,
  created_at timestamptz default now()
);

create table eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid references evals(id),
  model text not null,
  prompt_id text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metrics jsonb default '{}'::jsonb
);
```

## Datasets

Datasets live in `lib/evals/datasets.ts`. Each entry contains:

- `id` — stable slug (`baseline.qa`)
- `name`
- `samples` — `{ prompt: string; expected: string }[]`
- `judgePrompt` — optional system prompt for shadow evaluation.

// EDIT HERE: add your own datasets and heuristics.

## Running Evals

1. Enable the feature flag: `FF_EVALS=true`.
2. Visit `/evals` and select the dataset plus model set.
3. Submit the run. The API (`/api/evals/run`) loops the dataset through the LLM Router (mocked when `USE_MOCKS=true`).
4. Metrics captured:
   - `exact_match` — percentage of responses that match `expected` after normalization.
   - `bleu_like` — lightweight n-gram precision proxy.
   - `avg_latency_ms` — measured round-trip time.
   - `avg_tokens` — total token estimate.

## Leaderboard UI

The `/evals` page renders a sortable leaderboard table per dataset showing the latest run per model.
Click a row to view sample responses and judge notes.

## Extending Metrics

Augment `lib/evals/engine.ts` with custom scoring functions (e.g. toxicity, hallucination). Persist the numbers inside
`metrics` JSONB. The UI automatically surfaces unknown keys inside the metrics pill stack.

## Automation

Trigger periodic evals via the jobs worker: enqueue `POST /api/jobs/dispatch` with `{ "kind": "convert", "payload": { "evalId": "..." } }`
and adapt the handler to call `runEval()`.
