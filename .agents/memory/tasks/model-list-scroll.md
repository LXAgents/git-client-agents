---
name: model-list-scroll
description: Task record for loading more models as you scroll the model picker (1.6.2).
status: in-progress
---

# Load more models on scroll

## Goal / Objective / Detail

- **Goal:** the owner reported on 2026-10-31 that the model picker stops at 100 models.
- **Objective:** show the next 100 matches each time the list is scrolled near its bottom.
- **Detail:** the full list is already loaded in one request, so this only renders more rows.
  A new search resets to the first 100.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/model-list-scroll` | `.agents/` | |
| 2 | Load on scroll | Model picker paging, test | git-client-agents | `feat/model-list-scroll` | `src/` | |
| 3 | Release | 1.6.2 changelog and version | git-client-agents | `release/1.6.2` | `wiki/logs/`, `package.json` | |
