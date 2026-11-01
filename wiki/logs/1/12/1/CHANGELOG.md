# 1.12.1 — 2026-11-01

## Changed

- **API keys page split.** The Add key dialog is `components/AddKeyModal.tsx`, and choosing
  the admin or user endpoint for a key is `services/keys.ts`.
- **Model picker split.** `hooks/useProviderModels.ts` loads a provider's live list. The tabs
  and rows are in `components/model-picker/`.
- **One fewer request.** The Models page passes its provider list to the picker, which used to
  fetch it again every time it opened.

## Unchanged

- Every screen and API call. Works with git-server-agents 1.13.x.
