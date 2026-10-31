# 1.0.0 — 2026-10-31

First release: a management dashboard for git-server-agents 1.1.0.

## Added

- Sign-in as the operator (`ADMIN_TOKEN`) or as a whitelisted user with a GitHub or GitLab
  personal access token, kept per browser tab.
- Users page (operator): whitelist and remove users.
- Organizations page: import from the orgs the platform says you own; list and remove.
- API keys page: user and organization keys with priority, added through a User or
  Organization toggle; deletion with confirmation.
- Loading states, empty states and error toasts throughout; a layout that works down to
  phone width.
- Component tests and a CI workflow (lint, tests, type-checked build).

## Security

- `VITE_ADMIN_TOKEN` is a development convenience only and is documented as such: it is
  compiled into the bundle.
- Keys are never displayed beyond their last four characters.

Readers need to do nothing; this is the first version.
