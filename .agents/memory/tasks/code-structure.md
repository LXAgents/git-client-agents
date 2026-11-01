---
name: code-structure
description: Task record for the behaviour-neutral refactor of git-client-agents (ApiKeys and ModelPicker split into components, a hook and a key service) in 1.12.1.
status: done
---

# Code structure refactor (dashboard)

## Goal / Objective / Detail

- **Goal:** the two largest dashboard files each do one job, so they are easier to change.
  The owner asked for this on 2026-11-01. The plan is `/mnt/project-files/plans/code-refactor.md`.
- **Objective:**
  - `ApiKeys.tsx` keeps only the page and table. The Add key dialog moves to
    `components/AddKeyModal.tsx`, and the admin-vs-user create/delete routing to
    `services/keys.ts`.
  - `ModelPicker.tsx` keeps only the dialog. The live list moves to
    `hooks/useProviderModels.ts`, and the tabs and rows to `components/model-picker/`.
  - The Models page passes its provider list to the picker, so opening it costs one request
    fewer.
- **Detail:** nothing changes on screen or in the API. The existing tests pass unchanged. This is
  the dashboard half of git-server-agents 1.13.1.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/code-structure` | `.agents/` | #60 |
| 2 | Refactor | ApiKeys and ModelPicker split | git-client-agents | `refactor/code-structure` | `src/` | #61 |
| 3 | Release | 1.12.1 changelog and version | git-client-agents | `release/1.12.1` | `package.json`, `wiki/logs/` | #62 |

### Task 1 — plan/code-structure

This record was written before the work. Nothing else changed.

### Task 2 — refactor/code-structure

- `services/keys.ts`: `loadKeys`, `createKeyFor` and `deleteKeyOf` are the one place that
  picks the admin or user endpoint for a key's owner. `components/AddKeyModal.tsx` is the
  dialog, and `pages/ApiKeys.tsx` dropped from 257 to 88 lines.
- `hooks/useProviderModels.ts`, `components/model-picker/ModalityTabs.tsx` and
  `ModelRow.tsx`: `ModelPicker.tsx` dropped from 243 to 174 lines. It takes an optional
  `providers` prop, which the Models page passes.
- The 52 tests, typecheck, lint and build pass, with no test changed.

### Task 3 — release/1.12.1

The version is 1.12.1, with the changelog in `wiki/logs/1/12/1/CHANGELOG.md` and its index row. The PR column is filled in.
