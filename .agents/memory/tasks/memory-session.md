---
name: memory-session
description: Task record for keeping the dashboard session in memory instead of sessionStorage (1.4.0).
status: done
---

# Memory-only session

## Goal / Objective / Detail

- **Goal:** clear the SonarCloud "Browser Storage Poisoning" finding (tssecurity:S8475) in
  `session.ts`, reported again by the owner on 2026-10-31.
- **Objective:** the token is never written to browser storage. It lives in page memory only.
- **Detail:**
  - Sonar treats the `/api/auth/exchange` reply as untrusted, and validation doesn't count.
  - A reload or new tab now signs the user out.
  - The OAuth nonce (a random UUID) stays in sessionStorage.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/memory-session` | `.agents/` | |
| 2 | Memory-only session | Session, tests, sign-in text, README | git-client-agents | `feat/memory-session` | `src/auth/`, `src/pages/SignIn.tsx`, `README.md` | |
| 3 | Release | 1.4.0 changelog and version | git-client-agents | `release/1.4.0` | `wiki/logs/`, `package.json` | |
