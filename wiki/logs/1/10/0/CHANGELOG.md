# 1.10.0 — 2026-10-31

## Added

- **Role badges for everyone.** The owner gets **Owner**, and everyone else gets a light green
  **Free** badge (`--color-free`). The badges show in the sidebar and on the Users page.

## Changed

- **Open login.** Anyone can log in with GitHub or GitLab, so the whitelist wording is gone:
  - the Users page has a "Users" title and an "Add user" button (optional);
  - the Home stat is renamed to "Users";
  - the sign-in page no longer shows the "not whitelisted" message.

Needs git-server-agents 1.11.0.
