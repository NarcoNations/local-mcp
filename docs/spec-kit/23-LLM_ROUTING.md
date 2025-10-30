# 23 — LLM Routing (Local ↔ Cloud)

**TL;DR**  \
Policy‑driven model selection by task sensitivity, cost, latency, and quality.

## Policy
- YAML/TS map: task → preferred models; cost caps; fallbacks; cooldowns.
- Sensitive tasks → local only (no uploads).

## Telemetry
- Log latency, cost estimate, errors, win‑rate by model.

## API
- `POST /api/llm/route` → `{ task, prompt, vars }` → chosen model + output

## Acceptance
- Reproducible selection; budget respected; red-team gate for risky tasks.
