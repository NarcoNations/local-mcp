# 23 — LLM_ROUTING

Routing matrix for local + cloud models.

Models
- Local: gguf (llama, qwen, mistral) via llama.cpp/ollama
- Cloud: OpenAI GPT-5, Perplexity, Anthropic, etc.

Policy
- Classify request → latency/safety/quality band → pick route
- Fall back if provider quota/exceeded
- Log: prompt_id, model, temp, seed, tokens, latency

Config
- `/config/llm-routing.json` with rules + allowlist

Acceptance Criteria
- Each run records route decision + rationale
- Kill-switch for external calls; local-only mode

Edit here: add your device caps + API keys (env) for routing decisions.
