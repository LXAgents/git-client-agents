---
name: multi-provider-byok
description: Task record for the dashboard side of multi-provider BYOK: provider dropdowns and a provider + model per user, org and repository (client 1.12.0).
status: in progress
---

# Multi-provider BYOK (dashboard)

## Goal / Objective / Detail

- **Goal:** the dashboard lets each user, org and repository bring a key for any of the five
  AI providers and pick the provider and model `@agents` uses. Requested by the owner on
  2026-11-01; pairs with git-server-agents 1.13.0, which merges first.
- **Objective:**
  - The API keys page has a Provider dropdown, filled from `GET /api/user/providers`, and sends
    `provider` with the new key.
  - The Models page shows provider and model per row; the picker has a provider dropdown that
    reloads that provider's live list (with the row's org or repository key where needed),
    explains when a key is missing, and accepts a typed model id.
  - Saving sends `{ modality, provider, model }`.
- **Detail:** model settings arrive as `{ text: { provider, model } }`. Deploy with server
  1.13.0.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Plan | This record | git-client-agents | `plan/multi-provider-byok` | `.agents/` | |
| 2 | Provider choice | Types, API client, keys page, models page, picker, tests | git-client-agents | `feat/multi-provider-byok` | `src/` | |
| 3 | Release | 1.12.0 changelog and version | git-client-agents | `release/1.12.0` | `package.json`, `wiki/logs/` | |

### Task 1 — plan/multi-provider-byok

Record written before the work. Nothing else changed.

### Task 2 — feat/multi-provider-byok

- Types: `AiProvider`, `ModelChoice` (`{ provider, model }`), `ModelSettings` of choices,
  `ModelScope` (`orgId` / `repoId`); keys carry `providerSlug`.
- API client: `userApi.providers`, `adminApi.providers`; `models(modality, provider, scope)`;
  model PUTs send `{ modality, provider, model }`; new keys send `provider`.
- API keys page: Provider dropdown and a key label named after the provider.
- Models page and picker: rows read "model on Provider"; the picker has a Provider dropdown,
  lists that provider's live models with the row's org or repository key, shows the server's
  "add a key first" message inline, and offers "Use … as the model id" for any typed id.
- 52 tests, typecheck, lint and build pass.
