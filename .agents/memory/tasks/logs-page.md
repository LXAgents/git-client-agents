---
name: logs-page
description: Task record for the owner-only Logs page that reads the server's stored log lines.
status: in-progress
---

# Logs page

## Goal / Objective / Detail

- **Goal:** the owner asked on 2026-10-31 to store logs in the database and read them from a
  Logs item in the nav, for the owner only.
- **Objective:** a Logs page (owner only, like Users) lists `GET /api/admin/logs` newest first,
  with level and source filters, Refresh and Load more.
- **Detail:** needs git-server-agents 1.11.2, which adds the `Log` table and the endpoint.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/logs-page` | `.agents/` | |
| 2 | Logs page | Nav item, route, page, API, types, tests, docs | git-client-agents | `feat/logs-page` | `src/`, `README.md` | |
| 3 | Release | 1.11.0 changelog and version | git-client-agents | `release/1.11.0` | `wiki/logs/`, `package.json` | |
