# git-client-agents

A dashboard for [git-server-agents](https://github.com/LXAgents/git-server-agents) (1.3.0 or
later for the sign-in buttons and admin users). It follows the system light or dark theme. It
replaces the server's command line for whitelisting users, importing organizations and
managing the OpenRouter keys the agent spends.

## Who signs in, and what they see

| Sign in as | With | Pages |
|---|---|---|
| **Operator** | The server's `ADMIN_TOKEN` | Dashboard, Users, Organizations (list and remove), API keys (all) |
| **Admin user** | Continue with GitHub or GitLab, when the server lists your user ID in `GITHUB_ADMIN_ID` or `GITLAB_ADMIN_ID` | Everything the operator sees, plus importing your own orgs |
| **User** | Continue with GitHub or GitLab, or a personal access token (GitHub `read:org`, GitLab `read_api`) | Dashboard, Organizations you own (import and remove), API keys (yours and your orgs') |

- **Continue with GitHub / GitLab** appears for each platform whose client ID and secret are set
  on the server. The server sends you back with the token in the URL fragment. The dashboard
  takes it out of the address bar at once. With no client IDs set, the token form is shown instead.
- Only the operator and admin users can whitelist users. A user who isn't whitelisted is told so at sign-in.
- Organizations are **imported, never typed in**. The import dialog lists the orgs that GitHub
  or GitLab says you own. On GitHub the App must be installed on the org first.
- Organization keys can be added or deleted by owners only. The dashboard offers only orgs
  you own, and the server checks with the platform again on every request.
- Keys are shown by their last four characters only.

The token is kept in memory only, never in browser storage. Reloading the page or opening a
new tab asks you to sign in again.

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
| `VITE_ADMIN_TOKEN` | **Development only.** Signs you in as the operator automatically. Anything `VITE_*` is compiled into the JavaScript bundle and readable by anyone who loads the site, so leave it empty for any build that others can reach. |

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
- The admin token is never put in the image. Operators enter it at sign-in.

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
src/pages/            SignIn, Home, Users, Organizations, ApiKeys
```
