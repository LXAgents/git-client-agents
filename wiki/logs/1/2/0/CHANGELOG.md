# 1.2.0 — 2026-10-31

Sign in with GitHub or GitLab, admin users, and a modern look that follows the system theme.
Needs git-server-agents 1.3.0 for the sign-in buttons and admin users.

## Added

- **Continue with GitHub** and **Continue with GitLab** buttons, one for each platform whose
  client ID and secret are set on the server. Pasting a personal access token is still available
  behind a toggle, and is shown directly when no buttons are configured.
- After OAuth, the token or error is read from the URL fragment and removed from the address bar.
- Admin users: a user whose ID is in the server's `GITHUB_ADMIN_ID` or `GITLAB_ADMIN_ID` sees the
  operator pages, can still import their own orgs, and gets an "Admin" badge.

## Changed

- **New look:**
  - OKLCH colour tokens with `light-dark()`, so light and dark mode follow the system.
  - The Inter variable font, self-hosted.
  - Cards with soft shadows and larger radii, tinted badges, and a frosted sidebar and mobile top bar.
  - Gradient primary buttons and focus rings.
  - Entry transitions with `@starting-style`, container-query stat cards, and support for
    `prefers-reduced-motion`.
