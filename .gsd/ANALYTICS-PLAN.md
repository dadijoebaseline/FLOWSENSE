# Analytics Route Implementation Plan

## Project Context
- Name: Advanced GIS Analytics Dashboard with Temporal & Multi-Dimensional Analysis
- Type: Static Vercel Web App
- Data source: GeoJSON files with monthly datasets (Feb-May 2026)
- Existing features already implemented:
  - Interactive GIS Map (Leaflet)
  - GeoJSON Layer Rendering
  - Account Visualization with markers
  - Dashboard KPI Cards (anomaly-focused)
  - Static GeoJSON anomaly detection
  - Recharts for visualizations
  - React Query data loading
  - Framer Motion animations

## Objective
Transform the existing `/analytics` route into an enterprise-grade analytics dashboard featuring:
- **Temporal Analysis**: Consumption & revenue aggregations grouped by month and year
- **Multi-Dimensional Breakdown**: Analyze each dimension (area, bookNo/route, rateCode/classification, status)
- **Advanced Filtering**: Complex dimension combinations (e.g., ACTIVE status + rateCode 01 per area)
- **Metric Aggregation**: Comprehensive consumption and revenue metrics per dimension per time period

### Key Requirements

#### 1. TEMPORAL ANALYSIS
- Group all metrics by **month** and **year**
- Support month-over-month trend analysis
- Support year-over-year comparison (same month different years)
- All analytics modules must support temporal grouping
- UI to select month/year view

#### 2. DIMENSIONAL BREAKDOWN
Analyze consumption and revenue by:
- **Area** (`area` property) - per month/year
- **Route** (`bookNo` property) - per month/year
- **Classification** (`rateCode` property) - per month/year (mapped to names via ratecode table)
- **Status** (`status` property: ACTIVE/DISCONNECTED) - per month/year

#### 3. ADVANCED CUSTOM FILTERING
Support multi-filter combinations with AND logic:
- Examples:
  - All **ACTIVE** status per **area**
  - All **ACTIVE** + **RateCode 01** per **BookNo**
  - All **Residential** (rateCode 01/02/02A) per **area** with consumption > X
  - All **Disconnected** per **area** with revenue < Y
  - Complex: **Commercial accounts** (multiple ratecodes) + **ACTIVE** + **revenue between Y-Z** per **route**
- Support range filtering on consumption and revenue
- Real-time aggregation updates when filters change
- Show filtered results grouped by month/year
- Display match count and active filter tags

#### 4. DATA PROPERTIES MAPPING
| Field | Property | Type | Notes |
|-------|----------|------|-------|
| Area | `area` | String | Location/service area |
| Route | `bookNo` | String | Billing route number |
| Classification | `rateCode` | String | Customer class code (01-21 + variants) |
| Status | `status` | String | ACTIVE or DISCONNECTED |
| Consumption | `cumUsed` | Number | Monthly consumption (prsReading - prvReading) |
| Revenue | `billAmount` | Number | Billing amount |

#### 5. RATECODE TO CLASSIFICATION MAPPING
Must support these 25 classifications:
- 01: RESIDENTIAL
- 02/02A: RESIDENTIAL variants
- 03-12, 18-19: COMMERCIAL variants (9 codes)
- 05: INDUSTRIAL
- 09/09A/09B: GOVERNMENT (3 codes)
- 14-17/15A: INSTITUTIONAL (5 codes)
- 13: SUBDIVISION
- 20-21: BULK SALES

## Scope

### In Scope
- Extend `src/lib/staticDataService.js` with temporal aggregation methods
- Implement month/year grouping functions
- Build Analytics page in `src/pages/Analytics.jsx` with 5 analytics modules
- Add comprehensive KPI cards (7 total)
- Add multi-dimensional charts per module
- Implement advanced filter UI and logic
- Reuse existing map, charts (Recharts), and React Query patterns
- Store RateCode → Classification mapping for filter UI
- Session-only filters (no URL persistence)

### Out of Scope
- Route registration (already exists in App.jsx)
- Navigation/permission gating
- Reimplementing map rendering
- Backend analytics processing
- Predictive analytics or ML
- Export to CSV/reporting (future phase)

## Implementation Plan: 5 Phases

### Phase 1: Foundation - Temporal Aggregation & Data Service (Priority HIGH)
**Goal**: Enable month/year grouping in data service, ready for all modules

**Tasks**:
- [ ] 01-01: Extend `staticDataService.js` with month/year grouping functions
- [ ] 01-02: Implement temporal aggregation methods:
  - `getConsumptionByAreaPerMonth()` - Total/avg consumption per area per month
  - `getRevenueByRoutePerMonth()` - Total/avg revenue per route per month  
  - `getAccountsByStatusPerMonth()` - Account counts by status per month
  - `getMetricsByClassificationPerMonth()` - Metrics by rateCode per month
  - `getConsumptionTrendByYear()` - Year-over-year comparison
- [ ] 01-03: Store RateCode → Classification mapping as constant
- [ ] 01-04: Build 7 KPI cards component with temporal data
- [ ] 01-05: Create basic month/year selector UI
- [ ] 01-06: Verify temporal aggregation accuracy with sample data

**Files to modify**:
- `src/lib/staticDataService.js` - Add aggregation methods
- `src/pages/Analytics.jsx` - Add KPI scaffold and month selector
- `src/lib/rateCodeMap.js` - NEW file with RateCode → Classification mapping

**Success Criteria**:
- `staticDataService.getConsumptionByAreaPerMonth()` returns correct aggregations
- All 7 KPI cards display with accurate temporal data
- Month selector functional and updates KPIs

---

### Phase 2: Analytics Modules - Multi-Dimensional Charts (Priority HIGH)
**Goal**: Build 5 analytics modules with consumption/revenue by dimensions per month/year

**Tasks**:
- [ ] 02-01: Build Consumption Analytics module
  - Charts: Consumption by Area/Route/Status/Classification per month
  - Metrics: Total, avg, min, max, median per month
  - Top 10 consumers leaderboard
- [ ] 02-02: Build Revenue Analytics module
  - Charts: Revenue by Area/Route/Status/Classification per month
  - Metrics: Total, avg, min, max per month
  - Top 10 revenue accounts
- [ ] 02-03: Build Area Analytics module
  - Charts: Consumption/Revenue by Area with Status breakdown per month
  - Stacked bar: ACTIVE vs DISCONNECTED per area
  - Area ranking by consumption/revenue
- [ ] 02-04: Build Route Analytics module
  - Charts: Consumption/Revenue by Route with Status breakdown per month
  - Route efficiency ranking
  - Overloaded route detection
- [ ] 02-05: Build Status & Classification Analytics modules
  - Status: ACTIVE/DISCONNECTED ratios, trend
  - Classification: Residential vs Commercial breakdowns
- [ ] 02-06: Add year-over-year comparison views (same month different years)

**Files to modify**:
- `src/pages/Analytics.jsx` - Add module components
- `src/components/analytics/` - NEW folder for module components
  - `ConsumptionAnalytics.jsx`
  - `RevenueAnalytics.jsx`
  - `AreaAnalytics.jsx`
  - `RouteAnalytics.jsx`
  - `StatusClassificationAnalytics.jsx`

**Success Criteria**:
- All 5 modules display accurate aggregations by dimension per month
- Charts show correct temporal trends
- Metrics calculations verified

---

### Phase 3: Advanced Filtering System (Priority HIGH)
**Goal**: Implement multi-dimensional filter UI with dropdown lists and aggregation logic

**Tasks**:
- [ ] 03-01: Build Dropdown Filter Components
  - AreaFilter dropdown: Multi-select with available areas from data
  - RouteFilter dropdown: Multi-select with available routes (bookNo)
  - StatusFilter dropdown: Multi-select (ACTIVE, DISCONNECTED)
  - ClassificationFilter dropdown: Multi-select with RateCode + name (e.g., "01 - RESIDENTIAL")
  - ConsumptionRangeSlider: Dual-handle slider with min/max values
  - RevenueRangeSlider: Dual-handle slider with min/max values
- [ ] 03-02: Implement dropdown data loading
  - Extract unique areas from all accounts
  - Extract unique routes (bookNo) from all accounts
  - Extract unique statuses
  - Load 25 classifications with RateCode → name mapping
  - Calculate min/max consumption and revenue for sliders
- [ ] 03-03: Build filter logic with AND semantics
  - Parse active filters from UI selections
  - Apply all filters simultaneously to account records (AND logic)
  - Return filtered subset matching ALL selected criteria
  - Handle empty filters (show all data)
- [ ] 03-04: Build aggregation reducer for filtered data
  - Takes filtered records + month/year selector
  - Returns aggregations per dimension
  - Recalculates metrics: sum, avg, count per dimension
- [ ] 03-05: Connect filters to all modules and KPIs
  - Real-time updates (debounced 300ms) when filters change
  - Show updated aggregations per month/year
  - Update KPI cards with filtered totals
- [ ] 03-06: Add filter UI enhancements:
  - Active filter chips/tags display showing each applied filter
  - Match count indicator (N records matching / Total records)
  - Reset filters button (clears all selections)
  - Clear individual filter button (X on each chip)
  - Filter count badge on filter panel toggle
  - Visual indication when filters are active (highlight)

**Filter UI Layout**:
```
┌─ FILTERS ──────────────────────────────┐
│ Area: [Zone 1] [Zone 2] [+]            │
│ Route: [R001] [R002] [R003] [+]        │
│ Status: [ACTIVE] [DISCONNECTED]        │
│ Classification: [01-RES] [04-COM] [+]  │
│ Consumption: [0] ━━━━━━━━━ [50000]     │
│ Revenue: [0] ━━━━━━━━━ [100000]        │
│                                         │
│ [Reset All] [Apply Filters]             │
│ Showing 1,234 / 5,000 accounts          │
└─────────────────────────────────────────┘

Active Filters:
[Area: Zone 1] [Status: ACTIVE] [Revenue: 100-5000] ✕
```

**Filter Combinations to Support**:
- Area (single or multi-select)
- Route (single or multi-select)
- Status (ACTIVE/DISCONNECTED)
- Classification (single or multi-select)
- Consumption range (min-max slider)
- Revenue range (min-max slider)
- **Any combination of above with AND logic**

**Complex Filter Examples**:
1. Area: [Zone1, Zone2] + Status: [ACTIVE] = Show ACTIVE accounts in Zone1 OR Zone2
2. Route: [R001] + Classification: [01] + Status: [ACTIVE] = Show ACTIVE Residential accounts in Route R001
3. Status: [DISCONNECTED] + Revenue: [0, 500] = Show disconnected accounts with low revenue
4. Classification: [03,04,06] + Consumption: [1000, 5000] = Show specific commercial types with medium consumption

**Files to modify/create**:
- `src/components/analytics/`
  - `FilterPanel.jsx` - Main filter container
  - `AreaFilter.jsx` - Area dropdown (multi-select)
  - `RouteFilter.jsx` - Route dropdown (multi-select)
  - `StatusFilter.jsx` - Status dropdown (multi-select)
  - `ClassificationFilter.jsx` - Classification dropdown (multi-select) with mapping
  - `RangeSliderFilter.jsx` - Generic slider for consumption/revenue
  - `FilterChips.jsx` - Display active filter tags
- `src/hooks/useAnalyticsFilters.js` - Filter state hook with AND logic
- `src/pages/Analytics.jsx` - Integrate filter panel and connect to modules

**Filter Logic Pseudocode**:
```javascript
// Apply all active filters with AND logic
function applyFilters(accounts, filters) {
  return accounts.filter(account => {
    // All conditions must be true (AND)
    if (filters.areas.length > 0 && !filters.areas.includes(account.area)) return false;
    if (filters.routes.length > 0 && !filters.routes.includes(account.bookNo)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(account.status)) return false;
    if (filters.classifications.length > 0 && !filters.classifications.includes(account.rateCode)) return false;
    if (account.cumUsed < filters.consumptionMin || account.cumUsed > filters.consumptionMax) return false;
    if (account.billAmount < filters.revenueMin || account.billAmount > filters.revenueMax) return false;
    return true;
  });
}
```

**Success Criteria**:
- All 6 dropdown/filter types functional and load unique values from data
- Filter combinations with AND logic work correctly
- Aggregations update in real-time (debounced 300ms)
- Filtered results grouped by month/year show correct data
- Filter count shows N matching / Total
- Active filter chips display
- Reset button clears all selections
- Mobile-friendly filter UI

---

### Phase 4: Cross-Filter & Map Integration (Priority MEDIUM)
**Goal**: Enable chart interactions and bidirectional Dashboard map sync

**Tasks**:
- [ ] 04-01: Add clickable chart elements
  - Click area bar → apply Area filter
  - Click route bar → apply Route filter
  - Click status segment → apply Status filter
- [ ] 04-02: Implement map synchronization:
  - Filtered results map to markers on Dashboard map
  - Dashboard map responds to Analytics filter state
  - Shared filter context (React Context or Zustand)
- [ ] 04-03: Add interactive behaviors:
  - Hover chart → highlight map features
  - Click Dashboard map marker → apply filter in Analytics
  - Zoom/pan map → no automatic filter (user-initiated filtering only)
- [ ] 04-04: Test bidirectional sync

**Files to modify**:
- `src/lib/AuthContext.jsx` or new `FilterContext.jsx` - Shared filter state
- `src/pages/Analytics.jsx` - Map integration
- `src/pages/Dashboard.jsx` - Subscribe to filter changes

**Success Criteria**:
- Clicking chart bars applies filters
- Dashboard map shows filtered accounts
- Bidirectional sync verified

---

### Phase 5: Smart Insights & Polish (Priority MEDIUM)
**Goal**: Add dynamic insights and finalize UI/performance

**Tasks**:
- [ ] 05-01: Build smart insights panel
  - Rank-based: "Area East ranks #1 in consumption with X cu.m. (↑Y% vs prev month)"
  - Trend: "Route B12 revenue increased 15% month-over-month"
  - Anomaly: "Area West revenue is 20% below average"
  - Comparative: "Commercial uses 40% more water than Residential"
- [ ] 05-02: Make insights filter-aware (update when filters change)
- [ ] 05-03: Performance optimization:
  - Memoize aggregation functions (useMemo)
  - Lazy-load chart components (React.lazy)
  - Debounce filter changes (300ms)
- [ ] 05-04: UI polish:
  - Responsive layout for mobile
  - Loading states during aggregation
  - Empty states when no data matches filters
  - Smooth transitions with Framer Motion
- [ ] 05-05: Final validation and testing

**Files to modify**:
- `src/components/analytics/SmartInsights.jsx` - NEW insights panel
- `src/pages/Analytics.jsx` - Optimize rendering

**Success Criteria**:
- Insights display accurate observations
- Performance: Page responds in <300ms to filter changes
- Mobile responsive
- All states handled (loading, empty, error)

---

## Testing Plan

**Unit Tests**:
- Temporal grouping functions (month/year extraction)
- Aggregation reducers (consumption/revenue per dimension)
- Filter logic (AND semantics, range validation)
- RateCode mapping

**Integration Tests**:
- Filter + aggregation pipeline
- Month/year selector integration
- Chart update on filter change
- Map sync behavior

**Manual UAT**:
- Test filter combinations from user examples
- Verify temporal aggregations match hand-calculated data
- Cross-browser responsive testing (desktop, tablet, mobile)
- Performance test with all filters applied

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Performance degradation with large datasets | Medium | High | Memoize aggregations, use Web Workers if needed, test with 100k+ records |
| Filter logic complexity (edge cases) | Medium | Medium | Comprehensive unit tests, clear documentation of AND/OR semantics |
| Month/year grouping ambiguity | Low | Medium | Unit tests verify grouping accuracy with sample data |
| Dashboard map sync conflicts | Low | Medium | Shared context prevents race conditions, test bidirectional updates |

---

## Files Overview

**Modified**:
- `src/lib/staticDataService.js` - Add temporal aggregation methods
- `src/pages/Analytics.jsx` - Replace placeholder with full implementation

**New**:
- `src/lib/rateCodeMap.js` - RateCode → Classification mapping
- `src/components/analytics/FilterPanel.jsx` - Filter UI
- `src/components/analytics/ConsumptionAnalytics.jsx` - Consumption module
- `src/components/analytics/RevenueAnalytics.jsx` - Revenue module
- `src/components/analytics/AreaAnalytics.jsx` - Area module
- `src/components/analytics/RouteAnalytics.jsx` - Route module
- `src/components/analytics/StatusClassificationAnalytics.jsx` - Status/Classification module
- `src/components/analytics/SmartInsights.jsx` - Insights panel
- `src/hooks/useAnalyticsFilters.js` - Filter state hook
- `src/lib/FilterContext.jsx` - Shared filter context

---

## Success Metrics

✅ **Phase 1 Complete**: 
- 7 KPI cards show temporal data correctly
- Month/year selector functional
- Temporal aggregation verified

✅ **Phase 2 Complete**:
- All 5 modules display accurate dimensional charts
- Consumption and revenue aggregations per month/year
- Year-over-year comparisons available

✅ **Phase 3 Complete**:
- Advanced filtering with dimension combinations works
- All tested filter examples produce correct results
- Real-time aggregation updates verified

✅ **Phase 4 Complete**:
- Chart interactions trigger filters
- Dashboard map bidirectional sync verified

✅ **Phase 5 Complete**:
- Smart insights display dynamically
- Performance acceptable (<300ms filter response)
- Mobile responsive, all states handled
- Production ready

---

_Created: 2026-06-10 | Updated with temporal and advanced filtering requirements_
