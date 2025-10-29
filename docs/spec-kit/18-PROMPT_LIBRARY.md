# 18 — PROMPT_LIBRARY

Goal: Versioned prompt vault with optimiser + scoring across local and cloud LLMs.

Components
- Vault: Supabase table `prompts` + local mirror `/prompts/*.md`
- Versioning: semantic `prompt_id@vX.Y` with changelog
- Embeddings: `prompts_embed` (pgvector)
- Linter: style + token budget + variables audit
- Optimiser: persona-aware rewrite + A/B harness

CLI (stubs)
- vibe prompt save "Narco tone explainer"
- vibe prompt optimize ./prompt.md
- vibe prompt test --local gguf --openai gpt-5

API
- POST /api/prompts/save
- POST /api/prompts/optimise
- POST /api/prompts/ab-test

Acceptance Criteria
- Prompts round-trip between local md and Supabase
- A/B results stored with model+temp+seed
- Linter enforces placeholders ({{var}}) + guardrails

Edit here: define allowed model routes in 23-LLM_ROUTING.md.
