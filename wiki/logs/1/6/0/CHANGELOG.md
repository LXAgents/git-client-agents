# 1.6.0 — 2026-10-31

Platform logos, search in the import popups, and no more sign-out on reload after an OAuth
sign-in.

## Added

- **Logos:** the GitHub and GitLab logos replace the written platform names in every table and
  on the Models page. The name stays as alt text and a tooltip.
  - The sign-in buttons and the sidebar avatar use the same images.
- **Search:** the org and repository import popups filter their lists as you type.

## Fixed

- **F5 no longer signs you out after Continue with GitHub/GitLab.**
  - Since 1.4.0 the token lives only in page memory, so a reload lost it.
  - The tab now remembers which platform you used, as a fixed marker and never the token, and
    a reload goes straight back through that platform's OAuth.
  - Signing out, or an OAuth error, clears the marker.
  - A pasted token is still asked for again after a reload, and a new tab still asks you to
    sign in.
