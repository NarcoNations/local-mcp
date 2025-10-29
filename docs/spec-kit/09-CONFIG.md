# 09 — Configuration

Env keys (example):

```.env
PORT=5111
ALLOW_ORIGINS=http://localhost:3000,https://chat.openai.com
GUI_ENABLE=true
INDEX_DIR=.mcp/index
EMBEDDINGS=none|xenova|openai
```

- Validate on boot; log effective config.
- Never crash on missing optional features; degrade gracefully.
