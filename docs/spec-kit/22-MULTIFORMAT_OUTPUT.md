# 22 — MULTIFORMAT_OUTPUT

Transform any input → target formats:
- Copy deck, Exec brief, Tweet thread, Blog, Datasheet, Tech spec, PRD, Notion/Obsidian page, Code comments, Markdown doc pack

API
- POST /api/transform
- POST /api/transform/batch

Acceptance Criteria
- Deterministic templates, token budgets, and safe markdown
- Theme-aware (Narco Noir × VibeLabz Clean)
- A11y checks for docs (headings, alt, contrast)

Edit here: add template .mdx files under /templates/transform/*.mdx
