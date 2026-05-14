# BUILD & RUNTIME

**Analysis Date:** 2026-05-14

Dev & build commands (from `package.json`)
- Install: `npm install`
- Dev server: `npm run dev` → `vite` (default host `http://localhost:5173`)
- Build: `npm run build` → `vite build` (output to `dist/`)
- Preview: `npm run preview` → `vite preview`
- Lint: `npm run lint`

Windows PowerShell example
- npm install
- npm run dev

Serving `dist/`
- Static hosting recommended: Vercel, Netlify, GitHub Pages. `dist/` is present in repo; to serve locally:
  - `npx serve dist` (install `serve` globally first) or use `npm run preview` which serves built assets.

Environment variables
- App uses browser `fetch` to `/data/...` and does not depend on server-side envs.
- Codebase contains no `.env` usage of `process.env` or `import.meta.env` detected in `src/` (search recommended). (confidence: medium)

Vite and Tailwind specifics
- `vite.config.js` sets alias `@` → `./src` (see `vite.config.js`).
- `tailwind.config.js` content paths include `./src/**/*.{ts,tsx,js,jsx}` and `index.html`.

Committed build
- `dist/` exists in repository root — build artifacts appear committed. Inspect `dist/index.html` and `dist/assets`.

CI / Deploy hints
- No `.github/workflows` or other CI detected — add GitHub Actions for build/lint checks (recommended in TODOS.md).
- Deploy artifacts: `dist/` can be deployed to static hosts; ensure `public/` asset paths are correct.

Relevant files:
- `package.json`, `vite.config.js`, `tailwind.config.js`, `dist/index.html`, `public/data/*`

Confidence: high for commands; medium for env detection (no explicit env usage found).