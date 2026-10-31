---
name: free-role-open-login
description: Task record for the light green Free role badge and open login wording (dashboard 1.10.0).
status: in-progress
---

# Free role and open login

## Goal / Objective / Detail

- **Goal:** on 2026-10-31 the owner asked for a "free" label for normal users, in light green,
  and for anyone to be able to log in with GitHub or GitLab (server 1.11.0).
- **Objective:**
  - Role `free` replaces `member`.
  - Owners see the Owner badge and everyone else a light green Free badge, in the sidebar and
    on the Users page.
  - The whitelist wording becomes Users / Add user.
- **Detail:** there is no sign-up step; the first login creates the account.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This record | git-client-agents | `plan/free-role-open-login` | `.agents/` | |
| 2 | Free role and open login | Role badge, Users page, Home, sign-in text, tests, docs | git-client-agents | `feat/free-role-open-login` | `src/`, `README.md` | |
| 3 | Release | 1.10.0 changelog and version | git-client-agents | `release/1.10.0` | `wiki/logs/`, `package.json` | |
