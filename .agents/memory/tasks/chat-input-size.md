---
name: chat-input-size
description: Task record for the bigger, self-growing message boxes on the Chat page (client 1.16.1).
status: done
---

# Bigger chat message boxes

## Goal / Objective / Detail

- **Goal:** owen said on 2026-11-02 that the Chat page's message boxes are too small. Plan: `/mnt/project-files/plans/chat-manage-tools.md`.
- **Objective:** both boxes (Agent work and Team chat) span the pane's full width, start at four lines and grow with the text up to a limit, then scroll.
- **Detail:** the send button and the hint move under the box, so the narrow Team chat pane keeps its width for text. Enter still sends and Shift+Enter adds a line.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/chat-input-size` | `.agents/` | #78 |
| 2 | Bigger message boxes | Composer layout and auto height, tests, docs | git-client-agents | `fix/chat-input-size` | `src/components/chat/`, `wiki/` | #79 |
| 3 | Release | 1.16.1 changelog and version | git-client-agents | `release/1.16.1` | `wiki/logs/`, `package.json` | #80 |
