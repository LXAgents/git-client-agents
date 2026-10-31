# 1.8.0 — 2026-10-31

## Removed

- **The Operator sign-in.** The sign-in page offers Continue with GitHub/GitLab and a personal
  access token only.
  - The platform owner sees every page the operator did, plus imports and Models.
  - `VITE_ADMIN_TOKEN` / `VITE_ADMIN_PLATFORM` are gone.
  - Needs git-server-agents 1.9.0.
