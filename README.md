# git-client-agents

A dark, GitHub-settings style dashboard for
[git-server-agents](https://github.com/LXAgents/git-server-agents) (1.1.0 or later). It
replaces the server's command line for whitelisting users, importing organizations and
managing the OpenRouter keys the agent spends.

## Who signs in, and what they see

| Sign in as | With | Pages |
|---|---|---|
| **Operator** | The server's `ADMIN_TOKEN` | Dashboard, Users, Organizations (list and remove), API keys (all) |
| **User** | GitHub or GitLab, plus a personal access token (GitHub `read:org`, GitLab `read_api`) | Dashboard, Organizations you own (import and remove), API keys (yours and your orgs') |

- Only the operator can whitelist users. A user who isn't whitelisted is told so at sign-in.
- Organizations are **imported, never typed in**. The import dialog lists the orgs that GitHub
  or GitLab says you own. On GitHub the App must be installed on the org first.
- Organization keys can be added or deleted by owners only. The dashboard offers only orgs
  you own, and the server checks with the platform again on every request.
- Keys are shown by their last four characters only.

The token is kept in `sessionStorage`, so it stays with this browser tab and is cleared when
the tab closes.

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

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` (a static site; any static host works, with SPA fallback to `index.html`) |
| `npm run lint` | oxlint, warnings fail |
| `npm test` | Vitest component tests |

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, React Router, Axios, Lucide icons. Tests use
Vitest, Testing Library and jsdom.

```
src/services/api.ts   Axios client and typed admin/user endpoints
src/auth/             session storage and the sign-in context
src/components/       layout, table, modal, form fields, toasts, confirm-delete
src/pages/            SignIn, Home, Users, Organizations, ApiKeys
```
