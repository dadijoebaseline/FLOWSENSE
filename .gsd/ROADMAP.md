# Roadmap: FlowSense

## Overview

This roadmap captures the evolution of FlowSense from static anomaly detection to comprehensive analytics. Phase 1 is complete. Phase 2 focuses on improving dataset discovery, and Phase 2.5 introduces enterprise-grade analytics with temporal and multi-dimensional analysis.

## Phases

- [x] **Phase 1: Static Conversion** - Convert FlowSense from Base44-backed to a static Vite app
- [ ] **Phase 2: Static Data Experience** - Improve dataset discovery and month selection
- [ ] **Phase 2.5: Analytics Experience (NEW)** - Temporal & multi-dimensional analytics with advanced filtering
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

### Phase 2.5: Analytics Experience (NEW)

**Goal**: Transform Analytics route into enterprise-grade dashboard with temporal analysis, multi-dimensional breakdown, and advanced filtering.
**Depends on**: Phase 1
**Requirements**: 
- Temporal grouping (month/year)
- Dimensional aggregation (area, route, classification, status)
- Multi-dimensional filtering with dimension combinations
- Advanced filter UI
- Integration with existing Dashboard map

**Success Criteria**:

1. Analytics page displays 7 KPI cards with temporal data
2. All 5 analytics modules (Consumption, Revenue, Area, Route, Status/Classification) functional
3. Advanced multi-dimensional filtering working (supports combinations like Area+Status, Route+Classification)
4. Charts update in real-time when filters applied
5. Bidirectional sync with Dashboard map

Plans:
- [x] 02.5-01: Extend staticDataService with temporal aggregation methods
- [x] 02.5-02: Build 5 analytics modules with consumption/revenue by dimensions
- [x] 02.5-03: Implement advanced multi-dimensional filter system
- [x] 02.5-04: Cross-filter interaction and map synchronization
- [x] 02.5-05: Smart insights engine and performance optimization

**Implementation details**: See `.gsd/ANALYTICS-PLAN.md`

### Phase 3: Deployment & Documentation

**Goal**: Finalize GitHub repo setup and static hosting documentation.
**Depends on**: Phase 1, Phase 2, Phase 2.5
**Success Criteria**:

1. Repo is ready for GitHub push
2. README documents deployment and static data workflow
3. `dist/` is produced and deployable

Plans:
- [ ] 03-01: Add GitHub repo metadata and push instructions
- [x] 03-02: Document Vercel deployment and data file workflow

## Progress

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| Phase 1: Static Conversion | 3/3 | ✅ Complete |
| Phase 2: Static Data Experience | 0/3 | Not started |
| Phase 2.5: Analytics Experience | 5/5 | ✅ Complete |
| Phase 3: Deployment & Documentation | 1/2 | In progress |

## Timeline Estimate

- **Phase 1**: ✅ Complete
- **Phase 2**: 1-2 weeks
- **Phase 2.5**: 3-4 weeks (5 implementation phases)
- **Phase 3**: 1 week