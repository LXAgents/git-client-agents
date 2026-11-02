# 1.16.0 — 2026-11-02

## Added

- **Room picker.** The Chat page shows one room at a time: My chat, an imported repository or an imported organization. The first repository is picked by default.
- **Room details pane** (left): room name and platform, the model and provider the agent would use, AI and GitHub Codespaces key status, and the room's total tokens, estimated cost and agent answers, from `GET /api/chat/summary`.
- **Agent work pane** (middle): the Agent activity session with reports and agent replies in Markdown, live progress and streamed text for every answer in the room, and a box that asks the agent in the activity session.
- **Team chat pane** (right): the room's other sessions, messages only, with avatars and names; your messages, other people's and the agent's look different. The box reminds you to start with `@lxagents` in shared rooms.
- Markdown rendering with `react-markdown` (no raw HTML; links open in a new tab).

## Changed

- The three side-by-side rooms (My chat, Repository, Organization) are replaced by the picker and the three panes, laid out 20 / 50 / 30 on wide screens and stacked below.
- One stream per selected room, shared by the panes through a `ChatRoomProvider` context.

## Removed

- `components/chat/ChatPane.tsx` and `hooks/useChatRoom.ts`.

## Requires

- git-server-agents 1.19.0 or later (the room summary, the activity session for questions, avatars and usage).
