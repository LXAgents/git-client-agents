# 1.7.0 — 2026-10-31

The Owner badge, profiles from GitHub and GitLab, and one platform per session. Needs
git-server-agents 1.7.0.

## Added

- **Sidebar profile:** shows your avatar, display name and login, as GitHub or GitLab reports
  them.
- **Users page:** shows each user's avatar, name and login, plus a Role column (Owner or
  Member).

## Changed

- **Owner badge:** "Admin" is now **Owner**, for users whose role is `owner`.
- **One platform per session:** a GitHub sign-in sees only GitHub content, and a GitLab sign-in
  only GitLab content. The operator token sign-in now picks a platform too.
- **Whitelist user:** asks only for the numeric user ID on the session's platform. Names are no
  longer typed in or stored.

## Removed

- The Platform column on the Organizations, Repositories, API keys and Users tables.
