---
name: remove-operator
description: Task record for removing the ADMIN_TOKEN operator sign-in; platform owners cover it.
status: in-progress
---

# Remove the operator sign-in

## Goal / Objective / Detail

- **Goal:** the owner asked on 2026-10-31 to delete the operator, since `GITHUB_ADMIN_ID` and
  `GITLAB_ADMIN_ID` are always set.
- **Objective:** `/api/admin` and the owner pages open only for the platform owner's own
  sign-in. `ADMIN_TOKEN` and the Operator tab are removed.
- **Detail:** the operator had no function the owner lacks, so nothing moves.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/remove-operator` | `.agents/` | |
| 2 | Remove operator | Operator tab, session mode, dev token, tests, docs | git-client-agents | `feat/remove-operator` | `src/`, `README.md` | |
| 3 | Release | 1.8.0 changelog and version | git-client-agents | `release/1.8.0` | `wiki/logs/`, `package.json` | |
