# Pages and roles

What each person sees after signing in, and what each page does. The server checks every
action again with GitHub or GitLab, so the dashboard only shows what the server will allow.

## Who signs in

| Sign in as | With | Pages |
|---|---|---|
| **Owner** | Continue with GitHub or GitLab, as the one user in the server's `GITHUB_ADMIN_ID` or `GITLAB_ADMIN_ID` | Dashboard, Chat, Users, every Organization and Repository of that platform (list, import your own, remove any), API keys (all), Models, Logs |
| **Free** (anyone) | Continue with GitHub or GitLab. There is no sign-up: the first login creates the account | Dashboard, Chat, Organizations you own and Repositories you administer (import and remove), Models, API keys (yours, your orgs' and your repositories') |

- **Continue with GitHub / GitLab** appears for each platform whose client ID and secret are set
  on the server. With no client IDs set, the page says sign-in isn't set up yet. Personal
  access tokens can't sign in, because the server refuses them.
- **One platform per session.** A GitHub sign-in sees only GitHub users, orgs, repositories and
  keys, and a GitLab sign-in only GitLab ones, so the tables have no Platform column.
- **Profiles come from the platform.** Avatars, names and logins are read from GitHub or GitLab
  by the server. Only the numeric user ID and the role are stored.
- **Roles:** the sidebar and the Users page show **Owner** or a light green **Free**.

## Session

- The token is kept in memory only, never in browser storage.
- **Reloading keeps you signed in.** The tab remembers only which platform you used, as a fixed
  marker in `sessionStorage`. A reload goes back through that platform's OAuth, which returns
  at once for an app you already authorized. Signing out or an OAuth error clears the marker.
- **A new tab** always asks you to sign in.

## Users (owner)

Lists everyone who has logged in. Removing a user also removes their orgs and keys. They can
log in again as Free.

## Organizations and Repositories

- Organizations are **imported, never typed in**. The import dialog lists the orgs GitHub or
  GitLab says you own. On GitHub the App must be installed on the org first.
- Repositories are imported the same way, from the ones you administer (GitHub admin, GitLab
  Maintainer or Owner) inside an imported organization.

## API keys

- Each key is for one AI provider (OpenRouter, OpenAI, Anthropic, DeepSeek or z.ai) and belongs
  to you, an organization you own, or a repository you administer.
- For the provider the agent picked, keys are tried repository first (for collaborators and org
  members), then organization (for org members), then the commenter's own, each highest
  priority first.
- Organization keys can be added or deleted by org owners only.
- Keys are shown by their last four characters only.

### Workspace keys (GitHub sessions)

- On GitHub sessions, the switch next to **Add key** picks **AI keys** or **Workspace keys**: the
  page shows that table, and Add key opens that kind's dialog. GitLab sessions have AI keys only.
- GitHub personal access tokens with the `codespace` scope (and `repo` to push), for yourself,
  an organization you own or a repository you administer.
- Each key names its platform. For now the only one is **GitHub Codespaces**.
- With one, the agent can start a GitHub Codespace, run commands and push a branch for
  commenters with write access. Keys are listed in the order the agent tries them: repository,
  organization, yours, each highest priority first.
- Codespaces run and bill on the token owner's account. GitLab sessions don't show the section.

## Chat

- **One room at a time.** The picker at the top lists **My chat** (`user:{id}`), the imported
  repositories you can read and the imported organizations you are in. The first repository is
  picked by default. One live stream serves the room; picking another closes it and opens the
  new room's.
- **Room details** (left, read only, from `GET /api/chat/summary`): the room's name and platform,
  the model and provider the agent would use for you here and which setting it comes from, how
  many AI keys and GitHub Codespaces keys it could use (repository, organization, yours; never
  the keys), and the room's total tokens, estimated cost and number of agent answers. "at least"
  means some answers did not report a cost; answers from before server 1.19.0 count as answers
  without usage data. It refreshes when an answer or report arrives.
- **Agent work** (middle): the room's "Agent activity" session, with the reports of answers to
  comments and the agent's replies rendered as Markdown, plus live progress (tool calls such as
  "Creating GitHub Codespace...") and the text as it is written, for every answer in the room.
  Its box asks the agent in the activity session, so no `@lxagents` is needed.
- **Team chat** (right): the room's other sessions (pick one or start a **New** one) with
  messages only. Yours sit on the right, other people's on the left with their avatar, and the
  agent's are tinted and rendered as Markdown. In repository and organization rooms, start a
  message with `@lxagents` to ask the agent.
- Layout: 20 / 50 / 30 on wide screens (`lg`), stacked below that.
- Markdown never renders raw HTML, and links open in a new tab. People's messages are plain
  text. The stream is read with `fetch`, so the token stays in the `Authorization` header (with
  `X-Platform`) and is never put in a URL. "Live" next to the picker means it is connected; it
  reconnects by itself after a drop.

## Models

A comment that starts with `@lxagents` uses the repository's provider and model, then the
organization's, then the commenter's own, then the server default (`openrouter/free` on
OpenRouter). The Models page sets each one.

The picker loads the chosen provider's model list live and filters it as you type. Every
provider except OpenRouter needs a key to list its models: yours, or the organization's or
repository's for those rows. You can also type any model id. All nine modalities are shown,
and only Text can be picked for now.

## Logs (owner)

Lists what the server did, newest first: webhooks received or refused and why, answers, model
calls and errors. It shows the lines for your platform and the server's own, filtered by level
and source, with Load more for older lines. The server keeps them `LOG_RETENTION_DAYS` days
(14 by default).
