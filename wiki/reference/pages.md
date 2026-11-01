# Pages and roles

What each person sees after signing in, and what each page does. The server checks every
action again with GitHub or GitLab, so the dashboard only shows what the server will allow.

## Who signs in

| Sign in as | With | Pages |
|---|---|---|
| **Owner** | Continue with GitHub or GitLab, as the one user in the server's `GITHUB_ADMIN_ID` or `GITLAB_ADMIN_ID` | Dashboard, Users, every Organization and Repository of that platform (list, import your own, remove any), API keys (all), Models, Logs |
| **Free** (anyone) | Continue with GitHub or GitLab. There is no sign-up: the first login creates the account | Dashboard, Organizations you own and Repositories you administer (import and remove), Models, API keys (yours, your orgs' and your repositories') |

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
