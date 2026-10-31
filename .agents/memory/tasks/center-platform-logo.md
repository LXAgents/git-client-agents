---
name: center-platform-logo
description: Task record for centering the platform logo in the dashboard tables (1.6.1).
status: done
---

# Center the platform logo

## Goal / Objective / Detail

- **Goal:** the owner asked on 2026-10-31 for the platform logo to sit in the center of its column.
- **Objective:** center the "Platform" header and logo on the Organizations, Repositories,
  API keys and Users tables.
- **Detail:** the Models page shows the logo as a badge beside a name, so it is unchanged.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/center-platform-logo` | `.agents/` | #36 |
| 2 | Center the logo | Platform column alignment, test | git-client-agents | `feat/center-platform-logo` | `src/` | #37 |
| 3 | Release | 1.6.1 changelog and version | git-client-agents | `release/1.6.1` | `wiki/logs/`, `package.json` | #38 |
