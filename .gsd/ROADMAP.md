# Roadmap: FlowSense

## Overview

This roadmap captures the evolution of FlowSense from static anomaly detection to comprehensive analytics. Phases 1, 2.5, and 3 are complete with post-launch auth role implementation. Phase 2 focuses on improving dataset discovery, and Phase 6 represents future enterprise features.

## Phases

- [x] **Phase 1: Static Conversion** - Convert FlowSense from Base44-backed to a static Vite app
- [x] **Phase 2: Static Data Experience** - Improve dataset discovery and month selection (✅ 2026-06-11)
- [x] **Phase 2.5: Analytics Experience** - Temporal & multi-dimensional analytics with advanced filtering
- [x] **Phase 3: Deployment & Documentation** - Prepare GitHub/Vercel deployment guide and demo notes
- [x] **v1.0.0 Post-Launch: Auth Roles (NEW)** - Role-based access control for static deployment
- [ ] **Phase 4: Advanced Features** - URL state, exports, predictive analytics
- [ ] **Phase 5: Data Management** - Upload UI, data validation
- [ ] **Phase 6: Enterprise** - Backend auth, teams, API, auditing

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

### Phase 2: Static Data Experience ✅ COMPLETE (2026-06-11)

**Goal**: Improve how users explore static dataset months and understand data source.
**Depends on**: Phase 1
**Success Criteria**:

1. ✅ Users can see available month files clearly - Auto-discovery system dynamically detects available datasets
2. ✅ UI documentation explains how to add new months - See PHASE-02-SUMMARY.md
3. ✅ The dataset listing feels intuitive - Month dropdown populates automatically
4. ✅ The Analytics route is clarified as informational until a data ingestion flow is planned

Plans:
- [x] 02-01: Implement auto-discovery of dataset months with intelligent fallback (3-tier discovery pattern)
- [x] 02-02: Fix Analytics page async compatibility for month selector UI
- [x] 02-03: Document dataset management and rolling window maintenance

**Key Implementation**:
- 3-tier discovery: manifest → HEAD probing → hardcoded fallback
- Auto-discovers available geojson files without code changes
- 4-month rolling window maintenance (Feb-May → Mar-Jun → Apr-Jul as new files arrive)
- Commits: f124bfb, 14f25f5, 93a054a, a4b6d9b

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

### v1.0.0 Post-Launch: Auth Roles (NEW)

**Goal**: Fix authentication role assignment for static deployment, enabling admin-level access.
**Depends on**: Phase 3
**Success Criteria**:

1. Admin email correctly assigned from `VITE_ADMIN_EMAIL`
2. Role-based navigation working (Admin/Manager/Viewer)
3. No hardcoded demo emails
4. Uses actual Firebase user email for role assignment
5. Static deployment with zero backend infrastructure

**Implementation**: See `.gsd/AUTH-IMPLEMENTATION.md`

### Phase 4: Advanced Features

**Goal**: Finalize GitHub repo setup and static hosting documentation.
**Depends on**: Phase 1, Phase 2, Phase 2.5
**Success Criteria**:

1. Repo is ready for GitHub push
2. README documents deployment and static data workflow
3. `dist/` is produced and deployable

Plans:
- [x] 03-01: Add GitHub repo metadata and push instructions
- [x] 03-02: Document Vercel deployment and data file workflow
3/3 | ✅ Complete (2026-06-11) |
| Phase 2.5: Analytics Experience | 5/5 | ✅ Complete |
| Phase 3: Deployment & Documentation | 2/2 | ✅ Complete |
| v1.0.0 Post-Launch: Auth Roles | 1/1 | ✅ Complete |

**Overall Project Completion: 14/14 plans (100% core scope + Phase 2)**  
**Project Status: PRODUCTION READY + DATASET AUTO-DISCOVERY
| Phase 2.5: Analytics Experience | 5/5 | ✅ Complete |
| Phase 3: Deployment & Documentation | 2/2 | ✅ Complete |
| v1.0.0 Post-Launch: Auth Roles | 1/1 | ✅ Complete |

**Overall Project Completion: 11/11 plans (100% core scope)**  
**Project Status: SHIPPING READY + POST-LAUNCH ENHANCEMENTS** 🚀

## Timeline Estimate

- **Phase 1**: ✅ Complete
- **Phase 2**: 1-2 weeks
- **Phase 2.5**: 3-4 weeks (5 implementation phases)
- **Phase 3**: 1 week