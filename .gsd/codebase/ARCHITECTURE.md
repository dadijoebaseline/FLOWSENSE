# ARCHITECTURE

**Analysis Date:** 2026-05-14

Pattern Overview
- Single-page client-side React application built and shipped as static assets by Vite. (Entry: `index.html`, `src/main.jsx`)

Layers
- Presentation (UI): `src/components/` and `src/pages/` — React components and route pages (`src/pages/Dashboard.jsx`, `src/pages/Analytics.jsx`, `src/pages/Anomalies.jsx`, `src/pages/MapView.jsx`).
- Client state & queries: `src/lib/query-client.js` and `@tanstack/react-query` usage across pages. (e.g., `Dashboard.jsx` uses queries)
- Business logic / domain: `src/lib/anomalyDetection.js`, `src/lib/staticDataService.js`, `entities/*.json` (domain schemas).
- Assets / Data: `public/data/*.geojson` (static datasets). The app fetches these at runtime via relative paths. See `src/lib/staticDataService.js`.
- Build output: `dist/` (committed build artifacts present).

Entry Points
- Browser entry: `index.html` → `src/main.jsx`.
- App routing: `src/App.jsx` defines routes and wraps with `AuthProvider` and `QueryClientProvider`.

Data Flow (high level)
1. Startup: `App` mounts, `AuthenticatedApp` calls hooks in `AuthProvider` and renders routes.
2. Pages request data via `staticDataService` which fetches `/data/*.geojson` and calls `parseGeoJSON`.
3. `anomalyDetection.js` computes anomalies and provides structured objects to UI components.

Cross-cutting concerns
- Authentication: `src/lib/AuthContext.jsx` provides a static demo user for this static variant.
- Error handling: Lightweight console warnings and guarded returns (see `staticDataService.fetchGeoJSONFile`).
- Routing: client-side via `react-router-dom` in `src/App.jsx`.

Key files (entry & responsibilities)
- `index.html` — static page shell
- `src/main.jsx` — React bootstrap
- `src/App.jsx` — routing and app composition
- `src/lib/staticDataService.js` — data access layer (fetch static GeoJSON)
- `src/lib/anomalyDetection.js` — core business rules
- `entities/*.json` — JSON schema for domain objects
- `public/data/*` — GeoJSON datasets used at runtime

Confidence: high (based on code and README references).