---
name: agent-error-replies
description: Task record for removing the personal access token sign-in and the scoped package name (dashboard 1.9.0).
status: in-progress
---

# Remove the personal access token sign-in

## Goal / Objective / Detail

- **Goal:** the owner asked on 2026-10-31 to delete the "Use a personal access token instead"
  sign-in, alongside the server's error replies (server 1.10.0).
- **Objective:**
  - Sign-in is Continue with GitHub or Continue with GitLab only. The server refuses PATs.
  - The package is renamed `@lxagents/git-client-agents`.
- **Detail:** with no client IDs on the server, the page says sign-in isn't set up yet.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/agent-error-replies` | `.agents/` | |
| 2 | Remove PAT sign-in | Sign-in page, auth context, tests, docs, package name | git-client-agents | `feat/agent-error-replies` | `src/`, `README.md`, `package.json` | |
| 3 | Release | 1.9.0 changelog and version | git-client-agents | `release/1.9.0` | `wiki/logs/`, `package.json` | |
