# git-client-agents

A dashboard for [git-server-agents](https://github.com/LXAgents/git-server-agents). Sign in
with GitHub or GitLab to import organizations and repositories, bring your own AI provider
keys, and pick the provider and model that `@lxagents` comments use. It follows the system
light or dark theme.

## Quick start

```bash
cp .env.example .env    # set VITE_API_URL to where git-server-agents runs
npm install
npm run dev             # http://localhost:5173
```

## Wiki

| Page | What it covers |
|---|---|
| [Pages and roles](wiki/reference/pages.md) | Who can sign in, the session, and what each page does |
| [Configuration](wiki/reference/configuration.md) | `VITE_API_URL`, `API_URL`, `PORT` and the server's `CORS_ORIGINS` |
| [Development](wiki/guides/development.md) | Node version, scripts, stack and code layout |
| [Run with Docker](wiki/guides/docker.md) | The nginx image and its runtime config |
| [Release logs](wiki/logs/logs-index.md) | What changed in each version |
