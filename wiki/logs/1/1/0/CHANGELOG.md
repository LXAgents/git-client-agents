# 1.1.0 — 2026-10-31

The dashboard now ships as a Docker image that runs on any platform that deploys a Dockerfile.

## Added

- A root multi-stage `Dockerfile`:
  - Built with `node:26-slim` and served by `nginx:alpine`.
  - Listens on `PORT` (default 8080).
  - Falls back to `index.html` for deep links, and has a health check.
- `API_URL` is read when the container starts. It is written to `/config.js` and takes
  precedence over the build-time `VITE_API_URL`, so one image works with any server, and a new
  URL needs only a restart.
- `.dockerignore`, a "Run with Docker" section in the README, and tests for the API URL order.

## Notes

- The admin token is never written into the image or `config.js`.
- Set `CORS_ORIGINS` on the server to the dashboard's public URL.
