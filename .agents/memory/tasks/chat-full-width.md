---
name: chat-full-width
description: Task record for the full-width Chat page with a 20/40/40 pane split (client 1.16.2).
status: done
---

# Full-width Chat page

## Goal / Objective / Detail

- **Goal:** owen asked on 2026-11-02 for the three Chat panes to use all of the width, split 20% / 40% / 40%, so prompting is easier. Plan: `/mnt/project-files/plans/chat-full-width.md`.
- **Objective:** on `/chat` the page column has no width limit, and the panes are Room details 20%, Agent work 40% and Team chat 40% from the `lg` breakpoint.
- **Detail:** other pages keep the `max-w-5xl` column. Below `lg` the panes still stack.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/chat-full-width` | `.agents/` | |
| 2 | Full-width panes | Layout width on `/chat`, 20/40/40 grid, tests, docs | git-client-agents | `fix/chat-full-width` | `src/components/Layout.tsx`, `src/pages/Chat.tsx`, `wiki/` | |
| 3 | Release | 1.16.2 changelog and version | git-client-agents | `release/1.16.2` | `wiki/logs/`, `package.json` | |
