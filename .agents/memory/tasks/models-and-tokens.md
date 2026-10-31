---
name: models-and-tokens
description: Task record for the dashboard's Models and Repositories pages, the model picker and repository keys (1.5.0).
status: done
---

# Models and tokens per user, org and repo

## Goal / Objective / Detail

- **Goal:** users set the model the `@agents` trigger uses, for themselves, their orgs and
  their repositories, and attach keys to repositories. Requested by the owner on 2026-10-31.
- **Objective:**
  - A Models page with a picker that loads OpenRouter's list live and searches as you type.
  - Nine modality tabs; only Text is enabled for now.
  - A Repositories page to import repositories you administer.
  - A Repository target on the API keys page.
- **Detail:** needs git-server-agents 1.6.0.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/models-and-tokens` | `.agents/` | |
| 2 | Models and repositories | API client, Models page and picker, Repositories page, repo keys, docs | git-client-agents | `feat/models-and-tokens` | `src/`, `README.md` | |
| 3 | Release | 1.5.0 changelog and version | git-client-agents | `release/1.5.0` | `wiki/logs/`, `package.json` | |
