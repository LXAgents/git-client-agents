---
name: logos-search-resume
description: Task record for platform logos, search in the import popups and staying signed in on reload (1.6.0).
status: done
---

# Logos, import search, sign-in across reloads

## Goal / Objective / Detail

- **Goal:** three dashboard fixes the owner asked for on 2026-10-31.
- **Objective:**
  - Show the GitHub and GitLab logos (from git-server-agents `images/`) instead of their names.
  - Add a search box to the org and repository import popups.
  - Stop F5 from sending users back to the sign-in page.
- **Detail:**
  - The F5 sign-out came from 1.4.0, which keeps the token in memory only for SonarCloud.
  - The fix remembers only which OAuth platform the tab used, and silently re-runs OAuth on
    reload. Pasted tokens are still not stored.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/logos-search-resume` | `.agents/` | |
| 2 | Logos, search, resume | Logos, import search, OAuth resume, tests, docs | git-client-agents | `feat/logos-search-resume` | `src/`, `README.md` | |
| 3 | Release | 1.6.0 changelog and version | git-client-agents | `release/1.6.0` | `wiki/logs/`, `package.json` | |
