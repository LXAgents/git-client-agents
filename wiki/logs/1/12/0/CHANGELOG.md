# 1.12.0 — 2026-11-01

## Breaking

- Needs git-server-agents 1.13.0: model settings are read as `{ text: { provider, model } }`.

## Added

- **Provider for every key.** The Add API key dialog has a Provider dropdown (OpenRouter,
  OpenAI, Anthropic, DeepSeek, z.ai, from the server), and the key field is named after it.
- **Provider and model per user, organization and repository.** The model picker has a
  Provider dropdown that loads that provider's live model list, using the organization's or
  repository's key for those rows. Rows read "model on Provider".
- When a provider lists models only to key holders and there is no key yet, the picker says
  so inline. Any typed model id can be used as it is.
