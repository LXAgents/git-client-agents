# git-client-agents

A dashboard for [git-server-agents](https://github.com/LXAgents/git-server-agents) (1.7.0 or
later for roles, platform profiles and per-platform sessions). It follows the system light or dark theme. It
replaces the server's command line for whitelisting users, importing organizations and
managing the OpenRouter keys the agent spends.

## Who signs in, and what they see

| Sign in as | With | Pages |
|---|---|---|
| **Owner** | Continue with GitHub or GitLab, as the one user in the server's `GITHUB_ADMIN_ID` or `GITLAB_ADMIN_ID` | Dashboard, Users, every Organization and Repository of that platform (list, import your own, remove any), API keys (all), Models |
| **User** | Continue with GitHub or GitLab, or a personal access token (GitHub `read:org`, GitLab `read_api`) | Dashboard, Organizations you own and Repositories you administer (import and remove), Models, API keys (yours, your orgs' and your repositories') |

- **Continue with GitHub / GitLab** appears for each platform whose client ID and secret are set
  on the server. The server sends you back with the token in the URL fragment. The dashboard
  takes it out of the address bar at once. With no client IDs set, the token form is shown instead.
- **One platform per session.** A GitHub sign-in sees only GitHub users, orgs, repositories and
  keys, and a GitLab sign-in only GitLab ones, so the tables have no Platform column.
- **Profiles come from the platform.** Your avatar, name and login, and those on the Users page,
  are read from GitHub or GitLab by the server. Only the numeric user ID and role are stored.
- Only the platform's owner can whitelist users, by numeric user ID. A user who isn't
  whitelisted is told so at sign-in.
- Organizations are **imported, never typed in**. The import dialog lists the orgs that GitHub
  or GitLab says you own. On GitHub the App must be installed on the org first.
- Organization keys can be added or deleted by owners only. The dashboard offers only orgs
  you own, and the server checks with the platform again on every request.
- Repositories are imported the same way, from the ones you administer (GitHub admin, GitLab
  Maintainer or Owner) inside an imported organization.
- **Models:** a comment that starts with `@agents` uses the repository's model, then the
  organization's, then the commenter's own, then `openrouter/free`. The Models page sets each
  one. Its picker loads OpenRouter's model list live and filters it as you type. All nine
  modalities are shown, and only Text can be picked for now.
- **Keys** are tried repository first (for collaborators and org members), then organization
  (for org members), then the commenter's own.
- Keys are shown by their last four characters only.

The token is kept in memory only, never in browser storage.

- **Reloading after Continue with GitHub/GitLab keeps you signed in.** The tab remembers only
  which platform you used, as a fixed marker in `sessionStorage`. A reload goes back through
  that platform's OAuth, which returns at once for an app you already authorized. Signing out
  or an OAuth error clears the marker.
- **A pasted token** is not kept, so a reload asks for it again.
- **A new tab** always asks you to sign in.

## Run it

Needs Node.js 22.22.2+, 24.15+ or 26 (`.nvmrc` pins 26 LTS, which CI uses: `nvm use`). Older
Node prints `EBADENGINE` warnings on install.

```bash
cp .env.example .env    # set VITE_API_URL to where git-server-agents runs
npm install
npm run dev             # http://localhost:5173
```

On the server, allow the dashboard's origin: `CORS_ORIGINS=http://localhost:5173` (the
default), or your deployed URL.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | git-server-agents base URL (default `http://localhost:3000`) |

## Run with Docker

The root `Dockerfile` builds the app with Node and serves it with nginx. It runs on any platform
that deploys a Dockerfile, such as Render, Railway, Fly.io, Cloud Run or Koyeb.

```bash
docker build -t git-client-agents .
docker run -p 8080:8080 -e API_URL=https://your-server.example git-client-agents
```

| Variable | Purpose |
|---|---|
| `API_URL` | git-server-agents base URL, read when the container starts. To change it, restart the container. There is no need to rebuild. |
| `PORT` | Port nginx listens on (default 8080). Platforms set this themselves. |
| `VITE_API_URL` | Optional build argument (`--build-arg`). It is only used when `API_URL` is empty. |

How it works:

- The container writes `/config.js` from `API_URL` on every start, and the app reads it before
  `VITE_API_URL`.
- Deep links such as `/users` load the app.
- Hashed assets are cached for a year. `config.js` is never cached.

On the server, set `CORS_ORIGINS` to this container's public URL.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` (a static site; any static host works, with SPA fallback to `index.html`) |
| `npm run lint` | oxlint, warnings fail |
| `npm test` | Vitest component tests |

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, React Router, Axios, Lucide icons, Inter
(self-hosted). Colours are OKLCH tokens in `src/index.css` that use `light-dark()`, so one set
of styles serves both themes. Tests use
Vitest, Testing Library and jsdom.

```
src/services/api.ts   Axios client and typed admin/user endpoints
src/auth/             session storage and the sign-in context
src/components/       layout, table, modal, form fields, toasts, confirm-delete
src/pages/            SignIn, Home, Users, Organizations, Repositories, Models, ApiKeys
```
