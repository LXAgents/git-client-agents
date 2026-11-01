---
name: codespaces-and-chat
description: Task record for the dashboard's workspace keys and 3-pane chat page (client 1.14.0), on top of server 1.18.0.
status: done
---

# Workspace keys and the 3-pane chat

## Goal / Objective / Detail

- **Goal:** the dashboard side of server 1.18.0: people add GitHub Codespaces tokens (workspace keys) and talk to each other and the agent in User, Repository and Org chat rooms, seeing its progress live. owen asked on 2026-11-01; the plan is `/mnt/project-files/plans/codespaces-and-chat.md`.
- **Objective:** a Workspace keys section on the API keys page (user, org, repository; GitHub sessions only), and a Chat page with three panes (My chat, Repository, Organization), each with a room picker, chat sessions, the message list, live progress, streamed agent text and a send box.
- **Detail:** the stream is read with `fetch`, so the token stays in the `Authorization` header; messages are rendered as plain text. Server 1.18.0 (PRs #84-#90 in git-server-agents) must merge and deploy first.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/codespaces-and-chat` | `.agents/` || #68 |
| 2 | Workspace keys | API calls, keys section, add modal | git-client-agents | `feat/workspace-keys` | `src/services/`, `src/pages/ApiKeys.tsx`, `src/components/` || #69 |
| 3 | Chat | Chat API, stream reader, 3-pane page | git-client-agents | `feat/chat` | `src/services/chat.ts`, `src/hooks/`, `src/pages/Chat.tsx`, `src/nav.ts` || #70 |
| 4 | Release | 1.14.0 changelog and version | git-client-agents | `release/1.14.0` | `package.json`, `wiki/logs/` || #71 |

### Task 1 — plan/codespaces-and-chat

This record was written before the work. Nothing else changed.

### Task 2 — feat/workspace-keys

- `services/api.ts`: workspace key calls for user, org and repo (`/api/user/.../workspace-keys`), and `sessionHeaders()` for fetch callers.
- `services/workspaceKeys.ts`: load (sorted repo → org → user, then priority), create and delete by owner.
- `components/WorkspaceKeys.tsx` + `AddWorkspaceKeyModal.tsx`: a Workspace keys section under the AI keys, GitHub sessions only.
- Tests: `components/WorkspaceKeys.test.tsx`; 55 pass. Docs: `wiki/reference/pages.md`.

### Task 3 — feat/chat

- `types.ts`: chat rooms, sessions and the event shape. `services/chat.ts`: `chatApi`, `parseSse`, and `openChatStream` (fetch with the session headers, reconnects with backoff up to 30 s, stops on 4xx).
- `hooks/useChatRoom.ts`: sessions, the selected session's messages (merged by id with stream events), live activity per session, and room-wide activity for comment answers (no session) until their report.
- `components/chat/ChatPane.tsx` + `ChatMessage.tsx`, `pages/Chat.tsx`: three panes (My chat, Repository, Organization) with room and session pickers, plain-text messages, streamed text with a caret, progress, and a send box (Enter sends). The room view is keyed by room so a new room starts empty (oxlint forbids resetting state in effects).
- Chat in the nav and routes. Tests: `services/chat.test.ts`, `pages/Chat.test.tsx`; 62 pass, lint and build clean. Docs: `wiki/reference/pages.md`.

### Task 4 — release/1.14.0

Version 1.14.0, the changelog at `wiki/logs/1/14/0/CHANGELOG.md` and its index row, and the PR column above. Merges after server 1.18.0 (git-server-agents #84-#90).
