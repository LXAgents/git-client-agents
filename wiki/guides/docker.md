# Run with Docker

The root `Dockerfile` builds the app with Node and serves it with nginx. It runs on any
platform that deploys a Dockerfile, such as Render, Railway, Fly.io, Cloud Run or Koyeb.

```bash
docker build -t git-client-agents .
docker run -p 8080:8080 -e API_URL=https://your-server.example git-client-agents
```

The variables are `API_URL`, `PORT` and the optional `VITE_API_URL` build argument. See
[configuration](../reference/configuration.md).

How it works:

- The container writes `/config.js` from `API_URL` on every start, and the app reads it before
  `VITE_API_URL`.
- Deep links such as `/users` load the app.
- Hashed assets are cached for a year. `config.js` is never cached.

On the server, set `CORS_ORIGINS` to this container's public URL.
