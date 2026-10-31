# 1.6.2 — 2026-10-31

## Fixed

- **The model picker no longer stops at 100 models.** Scrolling near the bottom of the list
  adds the next 100, until every match is shown.
  - A new search starts again from the first 100, at the top of the list.
  - The whole list is still fetched once, so loading more is instant.
