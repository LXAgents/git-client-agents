# Configuration

The dashboard needs one thing: where git-server-agents runs.

| Variable | When | Purpose |
|---|---|---|
| `VITE_API_URL` | Build time (`.env`, or `--build-arg` for Docker) | git-server-agents base URL (default `http://localhost:3000`) |
| `API_URL` | Container start (Docker only) | git-server-agents base URL. It wins over `VITE_API_URL`. Restart the container to change it, no rebuild needed |
| `PORT` | Container start (Docker only) | Port nginx listens on (default 8080). Platforms set this themselves |

The server must allow the dashboard's origin with `CORS_ORIGINS`: `http://localhost:5173` (the
default) in development, or the dashboard's public URL once it is deployed.

The dashboard works with git-server-agents 1.14.0 and later, which use the `@lxagents` trigger
and store a provider and model per level.
