# 1.3.0 — 2026-10-31

The dashboard never reads a token from the URL. Needs git-server-agents 1.5.0. This fixes the
SonarCloud "Browser Storage Poisoning" finding in `session.ts`.

## Changed

- **Breaking:** after "Continue with GitHub/GitLab", the dashboard expects `#code=…` (or
  `#error=…`).
  - It swaps the code for the token with `POST /api/auth/exchange`, and saves the
    `{ platform, token }` from the server's reply.
  - A `#platform=…&token=…` fragment is ignored.
- The per-tab nonce from 1.2.2 is still checked before any exchange.
