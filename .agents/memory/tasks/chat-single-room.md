---
name: chat-single-room
description: Task record for the single-room, three-pane Chat page (client 1.16.0): room picker, details, agent work and team chat panes, Markdown.
status: in progress
---

# Single-room Chat page

## Goal / Objective / Detail

- **Goal:** owen asked on 2026-11-02 to turn the Chat page into one selected room (repository or organization) with three panes. Plan: `/mnt/project-files/plans/chat-single-room.md`. Needs server 1.19.0.
- **Objective:**
  - A room picker fed by `GET /api/chat/rooms`: My chat first, then repositories, then organizations; a repository is picked by default.
  - Left pane (read only): room name and platform, model and provider, AI and workspace key status, total tokens and estimated cost, from `GET /api/chat/summary`.
  - Middle pane: the Agent activity session, live `progress` and `token` events, `report` events and agent replies in Markdown, and an input that posts to the activity session.
  - Right pane: the room's other sessions, `message` events only, the current user, other people and the agent styled apart with avatars and names, and an input with an `@lxagents` reminder.
- **Detail:**
  - A `ChatRoomProvider` context holds the rooms, the current room and one stream per room; both panes subscribe to it.
  - Layout `lg:grid-cols-[1fr_2.5fr_1.5fr]` (20/50/30); stacked below `lg`.
  - `react-markdown` without raw HTML; links open in a new tab with `rel="noreferrer"`.
  - The old `ChatPane` and `useChatRoom` are deleted.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/chat-single-room` | `.agents/` | |
| 2 | Single-room chat | Provider, picker, three panes, Markdown, tests, docs | git-client-agents | `feat/chat-single-room` | `src/`, `wiki/` | |
| 3 | Release | 1.16.0 changelog and version | git-client-agents | `release/1.16.0` | `wiki/logs/`, `package.json` | |
