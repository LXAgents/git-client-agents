# 1.2.2 — 2026-10-31

A crafted sign-in link can no longer sign you in as someone else. This also fixes the
SonarCloud "Browser Storage Poisoning" finding. It needs no server change: it works with
git-server-agents 1.3.0 and later.

## Security

- **The OAuth return is bound to the tab that started it.**
  - "Continue with GitHub/GitLab" stores a one-time nonce and sends it as `?signin=…` in the
    redirect.
  - A `#platform=…&token=…` or `#error=…` fragment is accepted only when the nonce matches.
  - Anything else shows "Sign-in wasn't started from this tab" and stores nothing.
  - The nonce is single use, and it is removed from the address bar with the token.
- **`saveSession` writes only a validated session**, rebuilt field by field.
