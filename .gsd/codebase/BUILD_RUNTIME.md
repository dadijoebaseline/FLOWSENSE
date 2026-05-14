# BUILD & RUNTIME

**Analysis Date:** 2026-05-14 (updated)

Dev & build commands (from `package.json`)
- Install: `npm install`
- Dev server: `npm run dev` → `vite` (default host `http://localhost:5173`)
- Build: `npm run build` → `vite build` (output to `dist/`)
- Preview: `npm run preview` → `vite preview`
- Tests: `npm test` → `vitest --run`
- Lint: `npm run lint`

Windows PowerShell example
- npm install
- npm run dev

Serving `dist/`
- Static hosting recommended: Vercel, Netlify, GitHub Pages. To serve locally use `npm run preview`.

Vercel (production)
- Deployed using Vercel CLI to project `FLOWSENSE`.
- Example deployment performed from this branch; production URL: `https://flowsense-bice.vercel.app`.
- Canonical production alias: `https://tcwdflowsense.vercel.app` — use this alias for demos, published links, and internal documentation.
- Build command: `npm run build`; Output directory: `dist`
- Note: Vercel serves files in `public/` at the site root, so fetch('/data/<file>') works as expected.

Important notes
- `dist/` is currently committed in the repo. Recommended: remove `dist/` and add it to `.gitignore`, then let CI produce artifacts for each deployment.
- Tests added (Vitest) and executed locally in the repo; CI pipeline to run tests on push is recommended.

Environment variables
- App uses browser `fetch` to `/data/...` and has no required server-side envs for current static mode.

Vite and Tailwind specifics
- `vite.config.js` sets alias `@` → `./src` (see `vite.config.js`).
- `tailwind.config.js` content paths include `./src/**/*.{ts,tsx,js,jsx}` and `index.html`.

Relevant files:
- `package.json`, `vite.config.js`, `tailwind.config.js`, `dist/index.html`, `public/data/*`

Confidence: high for commands; medium for env detection (no explicit env usage found).