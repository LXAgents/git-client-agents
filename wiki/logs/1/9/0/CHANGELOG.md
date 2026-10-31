# 1.9.0 — 2026-10-31

## Removed

- **The personal access token sign-in.** "Use a personal access token instead" and its form
  are gone. Sign-in is Continue with GitHub or Continue with GitLab only.
  - The server (git-server-agents 1.10.0) refuses personal access tokens.
  - With no client IDs on the server, the page says sign-in isn't set up yet.

## Changed

- The package is renamed `@lxagents/git-client-agents`.
