# COMPONENTS

**Analysis Date:** 2026-05-14

Source folders: `src/components/` (see `D:\APPS\FLOWSENSE\src\components`)

Overview & major components
- Layout
  - `src/components/layout/AppLayout.jsx` — application chrome and outlet for pages.
- Dashboard components
  - `src/components/dashboard/StatsCard.jsx` — stat card (props: title, value, subtitle, icon, color, delay).
  - `src/components/dashboard/AnomalyChart.jsx` — charts (consumes `anomalies` prop).
  - `src/components/dashboard/RecentAnomalies.jsx` — list component (prop: `anomalies`).
- Map
  - `src/components/map/AnomalyMap.jsx` — renders `anomalies` prop using `react-leaflet` (props: `anomalies`, `height`).
- Anomalies list
  - `src/components/anomalies/*` — table/list views for anomaly records.
- UI primitives (shadcn-style)
  - `src/components/ui/*` — toaster, buttons and small primitives used across app (see `src/components/ui/toaster` referenced in `src/App.jsx`).

Props / Contracts (extracted patterns)
- Anomaly object (as used across UI, matches `entities/Anomaly.json`):
  - `account_id` (string)
  - `account_name` (string)
  - `address` (string)
  - `anomaly_type` ("sudden_high" | "zero_consumption" | "sudden_down")
  - `severity` ("low"|"medium"|"high"|"critical")
  - `average_consumption`, `current_consumption`, `deviation_percent` (numbers)
  - `latitude`, `longitude` (numbers)
  - `dataset_id`, `month_label` (strings)

Where state is kept
- Server-like state: none — app is static and uses `staticDataService` to fetch data from `public/data`.
- Client cached state: React Query (`src/lib/query-client.js`) — queries called in pages (e.g., `src/pages/Dashboard.jsx` uses `useQuery` for `anomalies` and `datasets`).
- Local UI state: inside components (e.g., `StatsCard` receives props, `AnomalyMap` computes local memoized values).

Styling
- Tailwind CSS is primary (`tailwind.config.js`, `src/index.css`).
- Component-level CSS via inline styles in map popup or utility classes in JSX. Radix components for accessibility patterns.

Where to look for component code
- `src/components/*` — all UI components
- Page composition: `src/pages/*` — uses components and props contracts
- UI primitives and theme: `src/index.css`, `tailwind.config.js`, and `components.json` (shadcn config)

Confidence: high (based on direct inspection of component files and `entities/` schema).