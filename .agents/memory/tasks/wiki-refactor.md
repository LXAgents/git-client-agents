---
name: wiki-refactor
description: Task record for moving the dashboard's human documentation from README.md into wiki/ pages and routing them from .agents/index (docs only, no release).
status: done
---

# Wiki refactor (dashboard)

## Goal / Objective / Detail

- **Goal:** the README is an overview and the facts live once, in `wiki/`. owen asked for this on 2026-11-01, following `agents-instruction/creators/information-creator.md`. The plan is `/mnt/project-files/plans/wiki-refactor.md`.
- **Objective:**
  - `wiki/guides/` (development, docker) and `wiki/reference/` (configuration, pages) hold what the README held.
  - `.agents/index/root-index.md` and `project-wiki-index.md` route `wiki/`. `memory-index.md`, with a `memory-tasks-index.md` child, lists every memory file once.
- **Detail:** documentation only, so there is no version bump and no new `wiki/logs/` directory. Facts that had gone stale since 1.12.0 (for example, "OpenRouter keys only") are corrected while they move.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/wiki-refactor` | `.agents/memory/` | |
| 2 | Wiki | Pages, indexes, README | git-client-agents | `docs/wiki-refactor` | `wiki/`, `.agents/index/`, `README.md` | |

### Task 1 — plan/wiki-refactor

This record was written before the work. Nothing else changed.

### Task 2 — docs/wiki-refactor

- README went from 116 to 24 lines: an overview, a quick start, and a table of wiki links.
- New pages: `wiki/reference/pages.md`, `wiki/reference/configuration.md`, `wiki/guides/development.md` and `wiki/guides/docker.md`.
- Corrected while moving: keys and model lists are per provider, and the server needs 1.14.0 or later.
- `.agents/index/`: `root-index.md`, `project-wiki-index.md`, a rebuilt `memory-index.md`, and a `memory-tasks-index.md` child, since tasks/ holds more than 10 files. Every link resolves.
