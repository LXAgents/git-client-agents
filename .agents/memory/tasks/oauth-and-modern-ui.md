---
name: oauth-and-modern-ui
description: Task record for "Continue with GitHub/GitLab" sign-in, admin users and the modern restyle (1.2.0).
status: done
---

# OAuth sign-in, admin users and a modern look

## Goal / Objective / Detail

- **Goal:** sign in with the platforms' client ID and secret instead of pasting a token, give the
  users named by `GITHUB_ADMIN_ID` / `GITLAB_ADMIN_ID` admin control, and replace the dated look,
  as the owner asked on 2026-10-31.
- **Objective:**
  - "Continue with GitHub" and "Continue with GitLab" buttons for the platforms the server reports
    from `/api/auth/providers`. Pasting a personal access token stays as a fallback.
  - On return, the token is read from the URL fragment and cleared from the address bar.
  - A user whose `/api/user/me` says `isAdmin` sees the operator pages.
  - A restyle on OKLCH tokens with light and dark mode.
- **Detail:** the restyle keeps Tailwind 4 and the component structure. It uses the Inter
  variable font (self-hosted), soft shadows, larger radii, `color-mix()`, `:has()`,
  `@starting-style` and container queries, and respects `prefers-reduced-motion`.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/oauth-and-modern-ui` | `.agents/` | #15 |
| 2 | Sign-in and restyle | OAuth return, admin users, new styles, tests, README | git-client-agents | `feat/oauth-and-modern-ui` | `src/`, README | #16 |
| 3 | Release | 1.2.0 changelog and version | git-client-agents | `release/1.2.0` | `wiki/logs/`, `package.json` | #17 |
