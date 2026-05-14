# Top Findings

**Analysis Date:** 2026-05-14 (updated)

1. Project is a browser-only static React + Vite app focused on water consumption anomaly detection. (confidence: high) — see `README.md`, `index.html`, `src/` files.
2. Anomaly detection updated: now uses delta-based consumption (current cumulative minus previous cumulative) with fallbacks for meter resets. Implemented in `src/lib/anomalyDetection.js`. (confidence: high)
3. Data ingestion improved: `parseGeoJSON()` now normalizes/stabilizes account IDs (AccountNumber / MeterNo / ogc_fid) and skips features without stable ids. Warnings available via `_warnings`. (confidence: high)
4. Fetch & UI improvements: `staticDataService` now tracks dataset load errors and UI shows a banner when loads fail. (confidence: high)
5. Tests and CI: Vitest tests added for parse and detection (`src/lib/__tests__/anomalyDetection.test.js`). Run `npm test` locally. (confidence: high)
6. Deployment: Built and deployed to Vercel (project: FLOWSENSE). Production URL: https://flowsense-bice.vercel.app (confidence: high).
7. Build artifacts: `dist/` is currently committed in the repo (see `dist/`). Recommended: remove `dist/` and use CI to build. (confidence: high)
8. Remaining risk: no runtime JSON schema validation yet — consider adding `zod`-based validation against `entities/*.json`. (confidence: medium)

Quick verification steps (post-change):
- npm install && npm run dev (verify local behavior)
- Check browser DevTools Network for `/data/*.geojson` responses
- Look for console messages:
  - "parseGeoJSON: skipping feature" (missing stable id)
  - "Error fetching GeoJSON file" (dataset load error)
- Run tests: `npm test` (Vitest)

This summary reflects code updates: deterministic IDs, delta consumption, load-error banner, and unit tests. See the other .gsd docs for details.
