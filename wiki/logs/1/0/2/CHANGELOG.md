# 1.0.2 — 2026-10-31

The repo now states the Node version it needs. No change to the dashboard itself.

## Changed

- `engines` requires Node.js `^22.22.2 || ^24.15.0 || >=26`, matching jsdom 30, react-router 8
  and undici 8. `.nvmrc` pins 26 LTS, which CI uses.

## Upgrading

The `EBADENGINE` warnings on `npm install` mean the local Node is too old (for example
22.15.0). Run `nvm install` in the repo to switch to Node 26, then `npm install` again.
