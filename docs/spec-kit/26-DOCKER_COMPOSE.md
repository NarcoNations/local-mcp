# 26 — DOCKER_COMPOSE (md-convert)

Add the md-convert worker to your dev stack.

## docker-compose.yml (fragment)
```yaml
services:
  md-convert:
    image: ghcr.io/narconations/md-convert:latest # or build: ./services/md-convert
    container_name: md-convert
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - UVICORN_WORKERS=2
      - MAX_PAGES=200
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 3s
      retries: 5
    volumes:
      - mdcache:/cache
volumes:
  mdcache:
```

## .env example
```env
MD_CONVERT_URL=http://localhost:8000
```

## Verification
- `curl -s http://localhost:8000/health` → `{ "ok": true }`
- Test convert: `curl -F file=@/path/file.pdf $MD_CONVERT_URL/convert -o out.zip`

## Notes
- Docker image bundles Pandoc, PyMuPDF, and Tesseract.
- For Apple Silicon, ensure the image has multi-arch support (linux/arm64).
- Pin image tag in CI for reproducibility.
