# 1.15.0 — 2026-11-02

## Added

- **Key type switch.** On GitHub sessions, an "AI keys | Workspace keys" switch sits next to Add key on the API keys page. It picks which keys the page lists, and Add key opens the dialog for that kind. GitLab sessions keep AI keys only.
- **Workspace key platform.** Adding a workspace key asks for its platform, and the table shows it. GitHub Codespaces is the only one for now.

## Changed

- Workspace keys moved from their own section below the AI keys to the Workspace keys side of the switch.

## Requires

- git-server-agents 1.18.0 or later. No server change.
