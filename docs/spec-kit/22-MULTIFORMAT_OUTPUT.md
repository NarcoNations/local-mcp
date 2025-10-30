# 22 — Multi‑Format Output Transformer

**TL;DR**  \
Any input → Copy deck / Exec brief / Tweet thread / Blog / Datasheet / PRD / Notion / Obsidian / Code comments / MD doc pack.

## Inputs
- Source text + target format + style (Narco Noir or VibeLabz Clean).

## Outputs
- Markdown + structured JSON (frontmatter) per format.

## API
- `POST /api/transform` → `{ input, target, style, options }`

## Acceptance
- Deterministic templates; tokens only; cites where required.
