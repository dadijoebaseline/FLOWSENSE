# DATA_FLOWS

**Analysis Date:** 2026-05-14

High-level flow
- Source: Static GeoJSON files stored in `public/data/` (e.g., `public/data/2026-03.geojson`).
- Ingestion: `src/lib/staticDataService.js` uses `fetch('/data/<file>')` to load each dataset at runtime.
- Parsing: `src/lib/anomalyDetection.js` contains `parseGeoJSON()` which maps GeoJSON `feature.properties` into `WaterAccount` objects.
- Business logic: `detectAnomaliesWithHistory()` in `src/lib/anomalyDetection.js` computes anomalies using historical accounts.
- Presentation: Pages/components request anomalies via React Query (`useQuery` in `src/pages/Dashboard.jsx`) and render charts/maps/tables.

API client layers
- No external network APIs used; all data is read from `public/data` using browser `fetch` within `src/lib/staticDataService.js`.
- Error handling: `fetchGeoJSONFile` logs errors and returns `{ features: [] }` — minimal validation.

Entities / Models
- JSON schemas in `entities/` define domain models:
  - `entities/WaterAccount.json` — fields and required `account_id`.
  - `entities/Anomaly.json` — anomaly contract (see `anomaly_type`, `severity`).
  - `entities/WaterDataset.json` — metadata for datasets.
- In-code models: `parseGeoJSON()` creates plain JS objects matching these schemas.

Serialization & Validation
- No runtime schema validation against `entities/*.json` is performed. Zod is present in dependencies but not used. (Actionable: add validation using `zod` or JSON-schema validator.)

Where to inspect code
- `public/data/` — static datasets
- `src/lib/staticDataService.js` — data access and dataset list
- `src/lib/anomalyDetection.js` — parsing and detection logic
- `entities/*.json` — canonical schema definitions

Confidence: high for flows and files; medium for absence of validation (inferred from lack of validation calls).