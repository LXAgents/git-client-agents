---
name: admin-dashboard
description: Task record for the git-client-agents React dashboard that manages git-server-agents.
status: in-progress
---

# Admin dashboard

## Goal / Objective / Detail

- **Goal:** a web dashboard to manage the git-server-agents whitelist and API keys instead
  of the server's CLI.
- **Objective:** a Vite + React + TypeScript app with a dark, GitHub-settings-style layout:
  Dashboard, Users, Organizations and API Keys pages backed by git-server-agents 1.1.0
  (`/api/admin` for the operator, `/api/user` for a signed-in user); lint, type-check,
  tests and build pass in CI.
- **Detail:** orgs are added by import only, never typed in; org keys are offered only for
  orgs the user owns (the server re-checks); the admin token is not baked into a build:
  `VITE_ADMIN_TOKEN` is a dev default and the token is otherwise entered at sign-in and held
  in `sessionStorage`.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record, `.gitignore` | git-client-agents | `plan/admin-dashboard` | `.agents/`, `.gitignore` | |
| 2 | Vite app | React + TS, Tailwind, Router, Axios, Lucide, ESLint | git-client-agents | `build/vite-app` | `package.json`, `vite.config.ts`, `src/main.tsx` | |
| 3 | Layout | Shell, sidebar, sign-in, home, toasts, API client | git-client-agents | `feat/layout` | `src/components/`, `src/services/api.ts`, `src/auth/` | |
| 4 | Pages | Users, Organizations (import), API Keys | git-client-agents | `feat/admin-pages` | `src/pages/` | |
| 5 | Tests and CI | Vitest + Testing Library, GitHub Actions | git-client-agents | `ci/workflow` | `src/**/*.test.tsx`, `.github/workflows/` | |
| 6 | Release | README, changelog, close-out | git-client-agents | `release/1.0.0` | `wiki/logs/1/0/0/`, `README.md` | |

## Progress

### Task 1 — plan/admin-dashboard

- Created this record, the memory index and `.gitignore` (excludes `.agents/plans/`).
