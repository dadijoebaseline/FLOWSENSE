# Top Findings

**Analysis Date:** 2026-05-14

1. Project is a browser-only static React + Vite app focused on water consumption anomaly detection. (confidence: high) — see `README.md`, `index.html`, `src/` files.
2. Codebase is JavaScript (JSX) with TypeScript tooling enabled (jsconfig + types in devDependencies) but not full TS: files are `.jsx`/`.js` (confidence: high) — see `package.json` and `jsconfig.json`.
3. Data is static GeoJSON in `public/data/` and consumed via `src/lib/staticDataService.js`. (confidence: high) — see `public/data/*` and `src/lib/staticDataService.js`.
4. Anomaly detection logic centralized in `src/lib/anomalyDetection.js` and entities described under `entities/`. (confidence: high)
5. UI uses Tailwind CSS + Radix + many 3rd-party UI libs; styling via `src/index.css` + `tailwind.config.js`. (confidence: high)
6. No CI workflows detected; `dist/` is committed (production build present). (confidence: high) — see `dist/`.
7. Tests are absent. Linting present via ESLint scripts but no test runner. (confidence: high) — see `package.json` scripts and missing test files.
8. App uses client-side routing (`react-router-dom`) and React Query for state. (confidence: high) — see `src/App.jsx`, `src/lib/query-client.js`.
9. Entities are defined as JSON schemas in `entities/` (Actionable: use these for validation). (confidence: high)
10. Major risk: runtime fetch of `/data/*.geojson` with no error reporting/validation beyond console warnings. (confidence: medium)

Onboarding checklist (quick):
- npm install
- npm run dev (open http://localhost:5173)
- Inspect `public/data/` files and `src/lib/staticDataService.js` to understand flow
- Read `src/lib/anomalyDetection.js` and `entities/*.json`
- Run `npm run lint`

This summary is also written to `.gsd/codebase/SUMMARY.md`.
