---
name: codespaces-and-chat
description: Task record for the dashboard's workspace keys and 3-pane chat page (client 1.14.0), on top of server 1.18.0.
status: in-progress
---

# Workspace keys and the 3-pane chat

## Goal / Objective / Detail

- **Goal:** the dashboard side of server 1.18.0: people add GitHub Codespaces tokens (workspace keys) and talk to each other and the agent in User, Repository and Org chat rooms, seeing its progress live. owen asked on 2026-11-01; the plan is `/mnt/project-files/plans/codespaces-and-chat.md`.
- **Objective:** a Workspace keys section on the API keys page (user, org, repository; GitHub sessions only), and a Chat page with three panes (My chat, Repository, Organization), each with a room picker, chat sessions, the message list, live progress, streamed agent text and a send box.
- **Detail:** the stream is read with `fetch`, so the token stays in the `Authorization` header; messages are rendered as plain text. Server 1.18.0 (PRs #84-#90 in git-server-agents) must merge and deploy first.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/codespaces-and-chat` | `.agents/` | |
| 2 | Workspace keys | API calls, keys section, add modal | git-client-agents | `feat/workspace-keys` | `src/services/`, `src/pages/ApiKeys.tsx`, `src/components/` | |
| 3 | Chat | Chat API, stream reader, 3-pane page | git-client-agents | `feat/chat` | `src/services/chat.ts`, `src/hooks/`, `src/pages/Chat.tsx`, `src/nav.ts` | |
| 4 | Release | 1.14.0 changelog and version | git-client-agents | `release/1.14.0` | `package.json`, `wiki/logs/` | |

### Task 1 — plan/codespaces-and-chat

This record was written before the work. Nothing else changed.
