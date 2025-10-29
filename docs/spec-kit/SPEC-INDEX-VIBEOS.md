# SPEC-INDEX — VibeOS: Autonomous Studio Stack

This index adds autonomous studio modules to the existing Spec Kit.

New files in `docs/spec-kit/`:
- 17-AGENT_TEAM.md — persona roster + modes
- 17A-DEPARTMENTS.md — department sections (Sales, Marketing, Manufacturing, Strategy Board, Ideas Lab)
- 18-PROMPT_LIBRARY.md — vault, optimiser, scoring
- 19-RESEARCH_ENGINE.md — query → structured intel
- 20-MVP_GENERATOR.md — one-shot build
- 21-ARCHIVIST.md — file mgmt + ingest brain
- 22-MULTIFORMAT_OUTPUT.md — doc transformer
- 23-LLM_ROUTING.md — local/cloud selection
- 24-WHITEBOARD_OS.md — spatial command system

Architecture layers to mirror in `00-ARCHITECTURE.md`:
User · Agent Layer · Knowledge · Ops · Compute · Security.

Commands (concept)
- vibe prompt save / optimize / test
- vibe mvp "<idea>"

Next
- Wire these into n8n + Codex hand-off.
- Add API route stubs under /apps/web/src/app/api/*.
