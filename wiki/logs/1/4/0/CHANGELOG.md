# 1.4.0 — 2026-10-31

The session token is kept in memory only. This clears the SonarCloud "Browser Storage
Poisoning" finding in `session.ts`.

## Changed

- **The token is never written to browser storage.** Reloading the page or opening a new tab
  asks you to sign in again.
- A session stored by an older version is removed and ignored.
- The per-tab OAuth nonce is unchanged.
