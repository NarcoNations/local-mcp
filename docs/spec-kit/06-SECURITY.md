# 06 — Security & Ethics

**Security**
- CORS: default deny; allow only ChatGPT origins you trust.
- Auth: local only by default; if exposed, require token.
- Secrets: no keys committed; `.env.local` only.
- Logging: avoid sensitive payloads.

**Ethics (Clean Intent)**
- Research/education use; do not enable wrongdoing.
- Filter and redact harmful content in ingestion.
- Provide disclaimers in GUI and README.
