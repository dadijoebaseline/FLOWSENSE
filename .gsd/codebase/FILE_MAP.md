# FILE_MAP

**Top files and purpose (top ~80 entries where present)**

- `index.html` — app shell, mounts `src/main.jsx`. (critical)
- `package.json` — scripts and dependency manifest. (critical)
- `vite.config.js` — Vite config and alias `@` → `src`.
- `tailwind.config.js` — Tailwind config and theme extensions.
- `jsconfig.json` — path alias and typecheck settings.
- `README.md` — project overview and run instructions.
- `components.json` — shadcn-like UI generator config.
- `dist/` — built production artifacts (committed). (critical)
- `public/data/*` — GeoJSON datasets used by the app. (critical)

src/
- `src/main.jsx` — React bootstrap. (critical)
- `src/App.jsx` — routing, providers (AuthProvider, QueryClientProvider). (critical)
- `src/index.css` — Tailwind entry CSS.

src/lib/
- `src/lib/anomalyDetection.js` — parsing & anomaly detection logic. (critical)
- `src/lib/staticDataService.js` — reads `public/data` and provides dataset list. (critical)
- `src/lib/query-client.js` — React Query client config.
- `src/lib/AuthContext.jsx` — static demo auth provider.
- `src/lib/PageNotFound.jsx` — fallback route.
- `src/lib/app-params.js`, `roleAccess.js`, `utils.js` — helpers.

src/pages/
- `src/pages/Dashboard.jsx` — main dashboard, uses React Query. (critical)
- `src/pages/Upload.jsx` — upload UI (static app variant may be limited).
- `src/pages/Anomalies.jsx` — anomaly list page.
- `src/pages/MapView.jsx` — full map view.

src/components/
- `src/components/layout/AppLayout.jsx` — site layout and navigation.
- `src/components/dashboard/StatsCard.jsx` — stat card component.
- `src/components/map/AnomalyMap.jsx` — map rendering (uses `react-leaflet`).
- `src/components/ui/*` — primitives (toaster, buttons).
- `src/components/anomalies/*` — table/list components.

entities/
- `entities/WaterAccount.json` — schema for account records. (critical)
- `entities/Anomaly.json` — anomaly schema. (critical)
- `entities/WaterDataset.json` — dataset metadata schema.

Other
- `components.json` — shadcn configuration for UI generation.

Notes:
- `dist/` being present suggests a production build was committed — verify in CI or remove if undesired.

Confidence: high (file presence confirmed).