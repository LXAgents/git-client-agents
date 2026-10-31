# 1.2.1 — 2026-10-31

Fixes for the SonarCloud findings. It looks and works the same.

## Added

- `.sonarcloud.properties`, so automatic analysis treats `*.test.ts(x)` and `src/test/` as
  tests.
- `src/utils/strings.ts` with `trimTrailingSlashes()`, with tests for it and the session check.

## Changed

- **Session check.** A session read from sessionStorage is used only when it has a known mode,
  a known platform and a single-word token. Anything else is removed.
- **Modal backdrop.** It is now a `<button>` behind the dialog, so no `<div>` has a click
  handler. Escape and the Close button work as before.
- **`enter` animation.** Its `@starting-style` block is top level instead of nested.
- **Install scripts.** `npm ci --ignore-scripts` in the Dockerfile and CI. No dependency needs
  them.
- **API URL.** The sign-in URL trims trailing slashes without a regex.
