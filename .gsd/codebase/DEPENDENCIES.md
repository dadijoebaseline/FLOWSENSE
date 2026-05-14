# DEPENDENCIES

**Analysis Date:** 2026-05-14

Source: `package.json` (see `D:\APPS\FLOWSENSE\package.json`)

Installation & run (Windows / PowerShell)
- Install dependencies: `npm install`
- Dev server: `npm run dev` (launches Vite)
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint` / `npm run lint:fix`

Direct dependencies (selected highlights)
- `react` ^18.2.0 — UI framework (`src/` files)
- `react-dom` ^18.2.0
- `react-router-dom` ^6.26.0 — routing (`src/App.jsx`)
- `@tanstack/react-query` ^5.x — data fetching (`src/lib/query-client.js`)
- `tailwindcss` + `tailwindcss-animate` — styling (`tailwind.config.js`, `src/index.css`)
- `react-leaflet` & `leaflet` — map rendering (`src/components/map/AnomalyMap.jsx`)
- `recharts` — charts (`src/components/dashboard/AnomalyChart.jsx`)
- `zod` — schema validation library present but not actively used in codebase (check `src/` for usage)
- `lodash`, `clsx`, `framer-motion` — utilities/animations

Dev dependencies
- `vite` ^6.x, `@vitejs/plugin-react`, `eslint`, `typescript` (typecheck via `tsc -p ./jsconfig.json`)

Notable / risky deps (observations)
- `moment` (large, deprecated in favor of date-fns) — consider migrating to `date-fns`. (risk: medium, impact: low)
- Many Radix UI packages (multiple small packages) — fine but increases install size. (risk: low)
- `vaul` and `baseline-browser-mapping` present — uncommon libraries; review for maintenance and purpose. (risk: medium)
- `leaflet` assets are included via `import 'leaflet/dist/leaflet.css'` in code. Ensure peer CSS is loaded. (risk: low)

Lockfiles & CI
- `package-lock.json` present — npm lockfile committed (`package-lock.json`).
- No `.github/workflows` detected (no CI). (risk: high — no automated checks)

Confidence: high for installed packages (directly from `package.json`), medium for risk evaluations.

Commands (Windows PowerShell)
- npm install
- npm run dev
- npm run build
- npm run preview
- npm run lint

Relevant files:
- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `package-lock.json`