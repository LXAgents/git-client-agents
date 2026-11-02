---
name: key-types
description: Task record for the platform choice on workspace keys and the AI keys / Workspace keys switch on the API keys page (client 1.15.0).
status: in progress
---

# Workspace key platforms and the key type switch

## Goal / Objective / Detail

- **Goal:** owen asked on 2026-11-02 for two changes to the API keys page: workspace keys name their platform (only GitHub Codespaces for now), and a choice between AI keys and Workspace keys sits before the Add key button.
- **Objective:**
  - The Add a workspace key dialog has a Platform field with GitHub Codespaces as its only option, sent as `provider: "github_codespaces"`. The workspace keys table shows a Platform column.
  - On GitHub sessions, an "AI keys | Workspace keys" switch sits left of Add key. It picks which table the page shows and which dialog Add key opens. GitLab sessions have no workspace keys, so they see no switch.
- **Detail:** the server already accepts `provider` on workspace keys (1.18.0), so this is dashboard only. More platforms are added to the list when the server supports them.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/key-types` | `.agents/` | |
| 2 | Key types | Platform field, key type switch, tests | git-client-agents | `feat/key-types` | `src/components/`, `src/pages/ApiKeys.tsx`, `src/services/`, `wiki/` | |
| 3 | Release | 1.15.0 changelog and version | git-client-agents | `release/1.15.0` | `package.json`, `wiki/logs/` | |
