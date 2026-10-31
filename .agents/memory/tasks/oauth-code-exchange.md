---
name: oauth-code-exchange
description: Task record for exchanging the sealed OAuth code for the token instead of reading it from the URL (1.3.0).
status: in-progress
---

# OAuth code exchange

## Goal / Objective / Detail

- **Goal:** the dashboard never reads a token from the URL. This clears the SonarCloud
  "Browser Storage Poisoning" finding in `session.ts`, which the owner reported again on
  2026-10-31.
- **Objective:**
  - The OAuth return carries `#code=<sealed>`.
  - The dashboard posts the code to `/api/auth/exchange` and keeps the `{ platform, token }`
    the server sends back.
- **Detail:**
  - The per-tab nonce check from 1.2.2 stays.
  - Needs git-server-agents 1.5.0.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/oauth-code-exchange` | `.agents/` | #24 |
| 2 | Code exchange | Read the code, exchange it, tests | git-client-agents | `feat/oauth-code-exchange` | `src/auth/`, `src/services/api.ts` | #25 |
| 3 | Release | 1.3.0 changelog and version | git-client-agents | `release/1.3.0` | `wiki/logs/`, `package.json` | #26 |
