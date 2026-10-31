# 1.11.0 — 2026-10-31

## Added

- **Logs page.** A Logs item in the nav, shown to the owner only, like Users. It lists the
  server's stored log lines newest first: webhooks received or refused and why, answers, model
  calls and errors. It has Level (All, Warnings and errors, Errors) and Source filters,
  Refresh, and Load more for older lines. It needs git-server-agents 1.12.0.
