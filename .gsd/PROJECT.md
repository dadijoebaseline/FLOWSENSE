# FlowSense

## What This Is

FlowSense is a static water anomaly detection dashboard that runs entirely in the browser. It consumes monthly GeoJSON files from `public/data/`, detects anomalous water usage, and visualizes results through charts, tables, and maps without any backend database.

## Core Value

Deliver a fully static, Vercel-friendly anomaly detection experience using only client-side data and pre-loaded GeoJSON files.

## Requirements

### Validated

- ✓ Static dataset ingestion from `public/data/*.geojson` — current implementation
- ✓ Anomaly detection and visualization in dashboard, map, and anomaly table — current implementation
- ✓ No backend database dependency, deployable as a static site — current implementation

### Active

- [ ] Add new monthly datasets by dropping GeoJSON into `public/data/` and redeploying
- [ ] Ensure the UI clearly reflects month selection and data source
- [ ] Document static deployment workflow for GitHub + Vercel
- [ ] Refine anomaly detection thresholds and active-status filtering for sudden up/down flags

### Out of Scope

- No Base44 cloud database usage — removed for static compatibility
- No server-side authentication flow — static demo user only
- No dynamic file upload or runtime dataset creation in production

## Context

This project was originally built on Base44 with a cloud database backend. It has been converted into a static React + Vite application that uses local GeoJSON APIs via `fetch('/data/<month>.geojson')`. The focus is on making the app deployable on static hosts like Vercel.

Recent refinement work has adjusted anomaly detection so `sudden_high` and `sudden_down` now require both a relative threshold and a meaningful absolute `cumUsed` shift, and `sudden_down` is only reported for active accounts.

## Constraints

- **Hosting**: Must deploy as a static site on Vercel or equivalent
- **Data**: All dataset files must live in `public/data/`
- **Backend**: No server-side database, no Base44 runtime dependency
- **Auth**: Static demo authentication only, no real login required

## Key Decisions

| Decision | Rationale | Outcome |
| -------- | --------- | ------- |
| Use `public/data/` for dataset storage | Static hosting requires filesystem-based data | ✓ Good |
| Remove Base44 SDK and cloud APIs | Eliminate backend dependency and simplify deployment | ✓ Good |
| Keep anomaly logic client-side | Avoid server runtime and preserve existing detection behavior | ✓ Good |

---

_Last updated: 2026-05-20 after static conversion, anomaly detection refinement, and documentation updates_