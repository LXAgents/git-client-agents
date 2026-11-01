---
name: lxagents-trigger
description: Task record for the dashboard side of renaming the comment trigger from the agents word to lxagents (1.13.0).
status: done
---

# The trigger becomes `@lxagents` (dashboard)

## Goal / Objective / Detail

- **Goal:** the dashboard names the new trigger. owen asked for this on 2026-11-01 ("change the mention from `@agents` to `@lxagents`"). The plan is `/mnt/project-files/plans/lxagents-trigger.md`.
- **Objective:** Home, Models and the README say `@lxagents`.
- **Detail:** this is text only. The server side is git-server-agents 1.14.0, where `@agents` stops triggering.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/lxagents-trigger` | `.agents/` | #63 |
| 2 | Trigger text | Home, Models, README | git-client-agents | `feat/lxagents-trigger` | `src/pages/`, `README.md` | #64 |
| 3 | Release | 1.13.0 changelog and version | git-client-agents | `release/1.13.0` | `package.json`, `wiki/logs/` | #65 |

### Task 1 — plan/lxagents-trigger

This record was written before the work. Nothing else changed.

### Task 2 — feat/lxagents-trigger

Home, the Models page header and comment, and the README say `@lxagents`. The 52 tests, typecheck and lint pass.

### Task 3 — release/1.13.0

Version 1.13.0, the changelog at `wiki/logs/1/13/0/CHANGELOG.md` and its index row. The PR column is filled in.
