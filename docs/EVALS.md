# Eval Lab — Quickstart

## Define Datasets
- Datasets live in `examples/next-adapter/lib/evals/datasets.ts`.
- Each dataset is an array of `{ input, expected }` pairs. Update the file with real questions / answers.
- // EDIT HERE markers identify where to extend judging heuristics.

## Running Evals
- POST `/api/evals/run` with scope `llm:*`:
  ```json
  {
    "dataset": "baseline-qa",
    "models": ["openai:gpt-4o", "anthropic:claude-3-haiku"],
    "promptId": "prompt-uuid"
  }
  ```
- When `FF_EVALS=false`, the router returns mocked outputs for local development.
- Results saved to `eval_runs` with aggregate metrics (`exact`, `bleuish`, `avgLatency`).

## UI
- `/evals` renders a leaderboard. Use `NEXT_PUBLIC_DEMO_API_KEY` for client fetches in demo mode.
- Historical runs surfaced beneath the runner for quick comparisons.

## Extending
- Swap `callModel` in `lib/evals/run.ts` with your LLM router integration.
- Add richer metrics (ROUGE, judge models) in the metrics block.
- Add dataset definitions to Supabase if you prefer runtime editing.
