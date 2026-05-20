# Roadmap: FlowSense

## Overview

This roadmap captures the current static deployment path for FlowSense. The first phase is complete: convert the app to a fully static, deployable React site that reads GeoJSON from `public/data/`.

## Phases

- [x] **Phase 1: Static Conversion** - Convert FlowSense from Base44-backed to a static Vite app
- [ ] **Phase 2: Static Data Experience** - Improve dataset discovery and month selection
- [ ] **Phase 3: Deployment & Documentation** - Prepare GitHub/Vercel deployment guide and demo notes

## Phase Details

### Phase 1: Static Conversion

**Goal**: Deliver a working static version of FlowSense with no backend database dependency.
**Depends on**: None
**Requirements**: Static data service, demo dataset files, static auth, buildable app
**Success Criteria**:

1. The app runs in the browser using `public/data/*.geojson`
2. Dashboards, map view, and anomaly list work without Base44
3. `npm run build` produces a valid `dist/` folder

Plans:
- [x] 01-01: Replace Base44 data calls with static data service
- [x] 01-02: Add sample GeoJSON files under `public/data/`
- [x] 01-03: Update auth and app configuration for static deployment

### Phase 2: Static Data Experience

**Goal**: Improve how users explore static dataset months and understand data source.
**Depends on**: Phase 1
**Success Criteria**:

1. Users can see available month files clearly
2. UI documentation explains how to add new months
3. The dataset listing feels intuitive
4. The Analytics route is clarified as informational until a data ingestion flow is planned

Plans:
- [ ] 02-01: Add month selector or dataset filter UI
- [ ] 02-02: Add dataset metadata and file instructions
- [ ] 02-03: Refine anomaly detection behavior for low-volume accounts and active-status filtering

### Phase 3: Deployment & Documentation

**Goal**: Finalize GitHub repo setup and static hosting documentation.
**Depends on**: Phase 1, Phase 2
**Success Criteria**:

1. Repo is ready for GitHub push
2. README documents deployment and static data workflow
3. `dist/` is produced and deployable

Plans:
- [ ] 03-01: Add GitHub repo metadata and push instructions
- [ ] 03-02: Document Vercel deployment and data file workflow

## Progress

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| Phase 1: Static Conversion | 3/3 | Complete |
| Phase 2: Static Data Experience | 0/3 | Not started |
| Phase 3: Deployment & Documentation | 0/2 | Not started |