# 1.5.0 — 2026-10-31

Pick the model the agent uses for yourself, your organizations and your repositories, and
attach keys to repositories. Needs git-server-agents 1.6.0.

## Added

- **Models page:**
  - It lists you, the organizations you own and the repositories you administer, with the
    text model each uses or what it falls back to.
  - A comment that starts with `@agents` uses the repository's model, then the organization's,
    then the commenter's own, then `openrouter/free`.
- **Model picker:**
  - It loads OpenRouter's model list live and filters it by name or ID as you type.
  - Each model shows its context size and price per million tokens, or a Free badge.
  - Nine modality tabs (Text, Image, Video, Speech, Decisions, Embeddings, Rerank,
    Transcription, Audio). Only Text can be picked for now; the others are faded.
  - "Use fallback" clears a setting.
- **Repositories page:**
  - Import repositories you administer (GitHub admin, GitLab Maintainer or Owner) from
    imported organizations.
  - Operators see and remove every repository.
- **API keys page:** a Repository target. The agent tries repository keys, then organization
  keys, then the commenter's own.
