# Development

## Requirements

Node.js 22.22.2+, 24.15+ or 26. `.nvmrc` pins 26 LTS, which CI uses (`nvm use`). Older Node
prints `EBADENGINE` warnings on install.

## Run it

```bash
cp .env.example .env    # set VITE_API_URL to where git-server-agents runs
npm install
npm run dev             # http://localhost:5173
```

See [configuration](../reference/configuration.md) for the variables and the server's
`CORS_ORIGINS`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/`, a static site. Any static host works, with SPA fallback to `index.html` |
| `npm run lint` | oxlint, warnings fail |
| `npm test` | Vitest component tests |

CI runs lint, typecheck, tests and build on every PR into `master`. SonarCloud analyses each PR.

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, React Router, Axios, Lucide icons and Inter
(self-hosted). Colours are OKLCH tokens in `src/index.css` that use `light-dark()`, so one set
of styles serves both themes. Tests use Vitest, Testing Library and jsdom.

## Code layout

```
src/services/api.ts            Axios client and typed admin/user endpoints
src/services/keys.ts           which endpoint stores or deletes a key for which owner
src/auth/                      session and the sign-in context
src/hooks/                     useLoad, useProviderModels
src/components/                layout, table, modal, form fields, toasts, confirm-delete,
                               AddKeyModal, ModelPicker (+ model-picker/ tabs and rows)
src/pages/                     SignIn, Home, Users, Organizations, Repositories, Models,
                               ApiKeys, Logs
```
