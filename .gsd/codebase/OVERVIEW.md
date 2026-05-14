# OVERVIEW

**Analysis Date:** 2026-05-14

Purpose
- Browser-only static dashboard for water consumption anomaly detection and visualization. See `README.md` and `index.html`.

Primary languages & frameworks
- JavaScript (JSX) React 18 — files under `src/` (e.g., `src/main.jsx`, `src/App.jsx`).
- Build: Vite (`vite.config.js`).
- Styling: Tailwind CSS (`tailwind.config.js`, `src/index.css`).
- State & data: TanStack React Query (`src/lib/query-client.js`).

Key runtime behavior
- On load, app reads static GeoJSON files from `public/data/*.geojson` using `fetch` in `src/lib/staticDataService.js`.
- Anomaly detection and parsing occur in `src/lib/anomalyDetection.js`.
- UI rendered at `src/main.jsx` → `src/App.jsx` with routes defined in `src/App.jsx`.

Where to start (for a new developer)
1. `README.md` — project summary and run commands.
2. `src/lib/staticDataService.js` — data ingestion from `public/data/`.
3. `src/lib/anomalyDetection.js` — core business logic for anomalies.
4. `src/pages/Dashboard.jsx` and `src/components/*` — how data maps to UI.
5. `entities/` — JSON schemas for domain models.

Confidence: high (claims supported by `README.md`, `src/` files, and `public/data/`).
