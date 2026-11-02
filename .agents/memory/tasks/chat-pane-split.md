---
name: chat-pane-split
description: Task record for the 10/45/45 Chat pane split (client 1.16.3).
status: done
---

# Chat pane split 10 / 45 / 45

## Goal / Objective / Detail

- **Goal:** owen asked on 2026-11-02, right after 1.16.2, for Room details to take 10% and Agent work and Team chat 45% each. Plan: `/mnt/project-files/plans/chat-full-width.md`.
- **Objective:** the Chat grid is `1fr 4.5fr 4.5fr` from the `lg` breakpoint.
- **Detail:** the page stays full width; below `lg` the panes still stack.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/chat-pane-split` | `.agents/` | #84 |
| 2 | 10/45/45 split | Chat grid, test, docs | git-client-agents | `fix/chat-pane-split` | `src/pages/Chat.tsx`, `wiki/` | #85 |
| 3 | Release | 1.16.3 changelog and version | git-client-agents | `release/1.16.3` | `wiki/logs/`, `package.json` | #86 |
