---
name: oauth-nonce
description: Task record for binding the OAuth return to the tab that started it, and the SonarCloud storage finding (1.2.2).
status: done
---

# OAuth return nonce

## Goal / Objective / Detail

- **Goal:** a crafted `#platform=…&token=…` link can't sign a visitor in as someone else's
  account. This also clears the SonarCloud "Browser Storage Poisoning" finding the owner
  reported on 2026-10-31.
- **Objective:**
  - "Continue with …" stores a one-time nonce and sends `/?signin=<nonce>` as the redirect.
  - The return is accepted only when the nonce matches.
  - `saveSession` stores only a validated, rebuilt session.
- **Detail:**
  - The server already keeps the redirect's query string, so it needs no change.
  - A mismatch shows "Sign-in wasn't started from this tab".

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/oauth-nonce` | `.agents/` | #21 |
| 2 | OAuth nonce | Nonce, validated save, tests | git-client-agents | `fix/oauth-nonce` | `src/auth/`, `src/pages/SignIn.tsx`, `src/services/api.ts` | #22 |
| 3 | Release | 1.2.2 changelog and version | git-client-agents | `release/1.2.2` | `wiki/logs/`, `package.json` | #23 |
