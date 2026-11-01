# 1.14.0 — 2026-11-01

## Added

- **Workspace keys.** A section on the API keys page (GitHub sessions) for GitHub personal access tokens with the `codespace` scope: yours, an organization's you own, or a repository's you administer. Listed in the order the agent tries them: repository, organization, yours.
- **Chat.** A new page with three panes side by side: My chat (the agent answers every message), Repository and Organization (start with `@lxagents` to ask the agent). Each room has sessions. The agent's progress, such as "Creating GitHub Codespace...", and its text as it is written show live, and answers to comments appear in your chat and the repository's.

## Requires

- git-server-agents 1.18.0 (`/api/user/.../workspace-keys` and `/api/chat`). Deploy the server first.
