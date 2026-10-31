---
name: install-warnings
description: Task record for the EBADENGINE warnings on npm install in git-client-agents (1.0.2).
status: done
---

# Install warnings

## Goal / Objective / Detail

- **Goal:** `npm i` runs clean, as the owner asked on 2026-10-31.
- **Objective:** the repo states the Node version it needs, and a clean install on that version
  shows no warnings.
- **Detail:** the warnings were `EBADENGINE` on Node 22.15.0. jsdom 30, react-router 8, undici 8
  and others need `^22.22.2 || ^24.15.0 || >=26`. Only upgrading Node fixes that while keeping
  the latest packages, so the repo now says so through `engines` and `.nvmrc`.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/install-warnings` | `.agents/` | #10 |
| 2 | Release | `engines`, `.nvmrc`, README, 1.0.2 changelog and version | git-client-agents | `release/1.0.2` | `package*.json`, `.nvmrc`, `wiki/logs/` | #11 |
