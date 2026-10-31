---
name: latest-dependencies
description: Task record for moving git-client-agents to the latest dependencies (1.0.1).
status: done
---

# Latest dependencies

## Goal / Objective / Detail

- **Goal:** run only on the latest dependencies, as the owner asked on 2026-10-31.
- **Objective:** `@types/node` 26 and `lucide-react` 1.66.0, Node 26 LTS in CI,
  `actions/checkout` and `actions/setup-node` v7, refreshed lockfile; lint, tests and build
  pass.
- **Detail:** indirect packages held back by their parents (for example Babel 7 under
  Testing Library) stay at the newest version the parent allows.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/latest-dependencies` | `.agents/` | #7 |
| 2 | Upgrade | Direct deps, CI versions, lockfile | git-client-agents | `build/latest-deps` | `package*.json`, CI | #8 |
| 3 | Release | 1.0.1 changelog and version | git-client-agents | `release/1.0.1` | `wiki/logs/`, `package.json` | #9 |
