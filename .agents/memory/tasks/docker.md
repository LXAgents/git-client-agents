---
name: docker
description: Task record for the git-client-agents Docker image (1.1.0).
status: done
---

# Docker image

## Goal / Objective / Detail

- **Goal:** run the dashboard on any online platform that runs Docker, as the owner asked on
  2026-10-31.
- **Objective:** a root multi-stage `Dockerfile` (Node build, nginx serve) that listens on `$PORT`,
  falls back to `index.html` for deep links, and takes the server URL from `API_URL` at container
  start, so changing it needs a restart, not a rebuild.
- **Detail:** many platforms don't pass build args, so `VITE_API_URL` alone isn't enough. The
  container writes `/config.js` (`window.__APP_CONFIG__`), and the app reads it before
  `VITE_API_URL`. The admin token is never written there.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/docker` | `.agents/` | #12 |
| 2 | Docker image | Dockerfile, nginx template, runtime config, test, README | git-client-agents | `feat/docker` | root, `docker/`, `public/`, `src/services/api.ts` | #13 |
| 3 | Release | 1.1.0 changelog and version | git-client-agents | `release/1.1.0` | `wiki/logs/`, `package.json` | #14 |
