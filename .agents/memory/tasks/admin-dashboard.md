---
name: admin-dashboard
description: Task record for the git-client-agents React dashboard that manages git-server-agents.
status: done
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
| 1 | Task record | This record, `.gitignore` | git-client-agents | `plan/admin-dashboard` | `.agents/`, `.gitignore` | #1 |
| 2 | Vite app | React + TS, Tailwind, Router, Axios, Lucide, ESLint | git-client-agents | `build/vite-app` | `package.json`, `vite.config.ts`, `src/main.tsx` | #2 |
| 3 | Layout | Shell, sidebar, sign-in, home, toasts, API client | git-client-agents | `feat/layout` | `src/components/`, `src/services/api.ts`, `src/auth/` | #3 |
| 4 | Pages | Users, Organizations (import), API Keys | git-client-agents | `feat/admin-pages` | `src/pages/` | #4 |
| 5 | Tests and CI | Vitest + Testing Library, GitHub Actions | git-client-agents | `ci/workflow` | `src/**/*.test.tsx`, `.github/workflows/` | #5 |
| 6 | Release | README, changelog, close-out | git-client-agents | `release/1.0.0` | `wiki/logs/1/0/0/`, `README.md` | #6 |

## Progress

### Task 1 — plan/admin-dashboard

- Created this record, the memory index and `.gitignore` (excludes `.agents/plans/`).

### Task 2 — build/vite-app

- Scaffolded with `create-vite` (react-ts template: React 19, TypeScript 7, Vite 8, oxlint
  instead of ESLint, which is the template's current default). Added Tailwind CSS 4 via
  `@tailwindcss/vite`, `react-router` 8, `axios`, `lucide-react`.
- `src/index.css` defines the GitHub dark palette as Tailwind theme colours.
- `.env.example` documents `VITE_API_URL` and why `VITE_ADMIN_TOKEN` is dev-only.
- `npm run lint` and `npm run build` pass.

### Task 3 — feat/layout

- `src/services/api.ts`: Axios instance (`VITE_API_URL`, default `http://localhost:3000`)
  whose interceptor adds `Authorization: Bearer` and, for users, `X-Platform`; typed
  `adminApi` and `userApi` for every git-server-agents 1.1.0 endpoint; `errorMessage`.
- `src/auth/`: session in `sessionStorage` (`VITE_ADMIN_TOKEN` only as a dev default);
  `AuthProvider` verifies a session against the server before keeping it.
- `src/components/`: sidebar `Layout`, `Button`, `Modal`, `Field`/`Segmented`, `DataTable`,
  `PageHeader`/`Badge`, `ConfirmDelete`, `ToastProvider`.
- Pages: `SignIn` (User with GitHub/GitLab token, or Operator) and `Home` (counts and how
  access works). Lint and build pass.

### Task 4 — feat/admin-pages

- `Users` (operator only): table, whitelist modal (platform, numeric user id, username),
  delete with a cascade warning.
- `Organizations`: operator sees and deletes all; a user sees orgs they own and imports
  through a modal listing what the platform says they own (rows show why one cannot be
  imported). There is no free-text org form anywhere.
- `API keys`: operator sees every key; a user sees their own keys plus keys of orgs they
  own. The add modal toggles User/Organization; the org picker lists owned orgs only.
- `useLoad` hook, `format.ts`; sign-out returns to the dashboard.
- Smoke-tested in Chromium against git-server-agents 1.1.0 with a mocked GitHub API:
  operator sign-in (bad token rejected), whitelist a user, user sign-in, import acme, add
  and delete own and org keys, member (bob) cannot import acme, stranger told they are not
  whitelisted, 390px layout.

### Task 5 — ci/workflow

- Vitest 5 + Testing Library + jsdom (`vitest.config.ts`, `src/test/`): session headers and
  storage, sign-in (user, not whitelisted, bad operator token), org import from the owned
  list only and operator delete with no add, API keys (own + org keys, org toggle, org-route
  delete). 11 tests pass.
- `.github/workflows/ci.yml`: one job (lint, test, type-check + build) on pushes to `master`
  and PRs into `master` only, doc-only changes skipped, superseded runs cancelled, 10-minute cap.

### Task 6 — release/1.0.0

- Version 1.0.0 (first release). README covers roles, import-only orgs, running, env vars
  and why `VITE_ADMIN_TOKEN` is dev-only; `wiki/logs/1/0/0/CHANGELOG.md` and the log index
  added. PR column filled. Record closed.
