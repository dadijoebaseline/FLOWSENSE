# OVERVIEW

**Analysis Date:** 2026-05-14 (updated)

Purpose
- Browser-only static dashboard for water consumption anomaly detection and visualization. See `README.md` and `index.html`.

Primary languages & frameworks
- JavaScript (JSX) React 18 — files under `src/` (e.g., `src/main.jsx`, `src/App.jsx`).
- Build: Vite (`vite.config.js`).
- Styling: Tailwind CSS (`tailwind.config.js`, `src/index.css`).
- State & data: TanStack React Query (`src/lib/query-client.js`).

Key runtime behavior (recent updates)
- On load, app reads static GeoJSON files from `public/data/*.geojson` using `fetch` in `src/lib/staticDataService.js`. The service now records load errors and exposes them to the UI.
- `parseGeoJSON()` (in `src/lib/anomalyDetection.js`) normalizes account identifiers and filters out features lacking a stable id. Problematic features include a `_warnings` field for diagnostics.
- Anomaly detection now computes monthly consumption using deltas between cumulative readings (current - previous) and compares against average historical monthly consumption. Implemented in `detectAnomaliesWithHistory()`.
- UI includes an error banner when dataset loads fail and unit tests are present for parsing and detection.

Where to start (for a new developer)
1. `README.md` — project summary and run commands.
2. `src/lib/staticDataService.js` — data ingestion, dataset list, and load-error tracking.
3. `src/lib/anomalyDetection.js` — parsing, normalization, and delta-based anomaly detection.
4. `src/pages/Dashboard.jsx` and `src/components/*` — how data maps to UI (tables, charts, map).
5. `src/lib/__tests__/anomalyDetection.test.js` — unit tests demonstrating expected behavior.

Confidence: high (claims supported by `README.md`, `src/` files, and `public/data/`).
