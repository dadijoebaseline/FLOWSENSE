# Analytics Page Master Prompt

**Project**: FlowSense Analytics  
**Version**: v1.0  
**Date**: 2026-06-11  
**Scope**: Analytics Page Only  
**Status**: Ready for Implementation  

---

## ⚠️ CRITICAL SAFEGUARD

**This prompt is EXCLUSIVE to the Analytics page.**

❌ **DO NOT** apply to:
- Anomaly detection logic
- Anomaly dashboard or KPI cards
- Authentication system
- Map rendering
- User management
- Any other feature

✅ **ONLY** modify:
- `/src/pages/Analytics.jsx` and related analytics components
- `/src/lib/staticDataService.js` (analytics methods only)
- `/src/components/analytics/*` (new or enhanced analytics modules)
- `/prompt/` and `.gsd/` documentation files

---

## 1. PURPOSE & GOALS

### Primary Goal
Provide a **holistic, enterprise-grade analytics dashboard** that delivers meaningful insights across the **entire dataset** from all GeoJSON files (Feb-May 2026), covering:
- ✅ ALL accounts (with and without anomalies)
- ✅ ALL statuses (ACTIVE, DISCONNECTED, all combinations)
- ✅ ALL classifications (Residential, Commercial, Industrial, Government, etc.)
- ✅ Temporal trends (month-over-month, year-over-year)
- ✅ Comparative analysis (dataset total vs anomaly subset)

### Key Difference: Analytics ≠ Anomalies
| Aspect | Analytics Page | Anomaly Dashboard |
|--------|-----------------|-------------------|
| **Data Scope** | ALL accounts | Anomalous accounts only |
| **Focus** | Trends, patterns, distribution | Exceptions, outliers |
| **Insight Type** | Healthy baseline, operational efficiency | Problems, alerts, thresholds |
| **Questions Answered** | "What is normal? What's the trend?" | "What's broken? What's changed?" |
| **User Audience** | Operations, Managers | Maintenance, Technicians |

---

## 2. DATA COVERAGE CHECKLIST

### ✅ Requirement 1: Include ALL Accounts

**Every account from all 4 GeoJSON files must be included:**
```
2026-02.geojson → All accounts from Feb 2026
2026-03.geojson → All accounts from Mar 2026
2026-04.geojson → All accounts from Apr 2026
2026-05.geojson → All accounts from May 2026
```

**Rule**: No filtering. No bias toward anomalous accounts. No pre-selection.

**Verification**:
- Total account count in analytics = sum of unique accounts across all months
- No accounts should be "hidden" or excluded
- Disconnected accounts = included with $0 or null consumption if not present

### ✅ Requirement 2: Include ALL Statuses

**Every status value must be represented:**
- `ACTIVE` - Actively consuming water
- `DISCONNECTED` - Not consuming ($ ≈ 0)
- `Renewed` - Reconnected mid-month
- `NEW` - New connection
- Any other status present in data

**Breakdown needed in every metric:**
```
Total Consumption = ACTIVE consumption + DISCONNECTED consumption + Other statuses
Account Count = ACTIVE count + DISCONNECTED count + Other count
```

### ✅ Requirement 3: Include ALL Classifications

**All 25 rateCode mappings must be included:**
- Residential (01, 02, 02A) - 3 codes
- Commercial (03, 04, 06, 07, 08, 10, 11, 12, 18, 19) - 10 codes
- Industrial (05) - 1 code
- Government (09, 09A, 09B) - 3 codes
- Institutional (14, 15, 15A, 16, 17) - 5 codes
- Subdivision (13) - 1 code
- Bulk Sales (20, 21) - 2 codes

**Grouping Strategy:**
- Show individual classifications in detailed views
- Group by category (Residential/Commercial/etc.) in summary views
- Ensure unknown/unmapped rateCodes are shown as "Unclassified"

---

## 3. CORE METRICS & CALCULATIONS

### 3.1 Total Metrics (Dataset-Wide)

**Consumption Totals**
```
Total Consumption (all) = SUM(cumUsed) across all accounts, all months
Total Consumption (ACTIVE) = SUM(cumUsed) where status = "ACTIVE"
Total Consumption (DISCONNECTED) = SUM(cumUsed) where status = "DISCONNECTED"
```

**Revenue Totals**
```
Total Revenue (all) = SUM(billAmount) across all accounts, all months
Total Revenue (ACTIVE) = SUM(billAmount) where status = "ACTIVE"
Total Revenue (DISCONNECTED) = SUM(billAmount) where status = "DISCONNECTED"
```

**Account Counts**
```
Total Active Accounts = COUNT(distinct accounts) where status = "ACTIVE"
Total Disconnected Accounts = COUNT(distinct accounts) where status = "DISCONNECTED"
Total Accounts = Total Active + Total Disconnected + Others
```

### 3.2 Average Metrics

**Per-Account Averages**
```
Avg Consumption per Account = Total Consumption / Total Accounts
Avg Revenue per Account = Total Revenue / Total Accounts
Avg Consumption (ACTIVE only) = Total Consumption (ACTIVE) / Active Accounts
```

**Temporal Averages**
```
Avg Monthly Consumption = Total Consumption / number of months
Avg Monthly Revenue = Total Revenue / number of months
```

### 3.3 Distribution Metrics

**Status Breakdown**
```
% ACTIVE = (ACTIVE accounts / Total accounts) × 100
% DISCONNECTED = (DISCONNECTED accounts / Total accounts) × 100
```

**Consumption Distribution**
```
Min Consumption = MIN(cumUsed) across all accounts
Max Consumption = MAX(cumUsed) across all accounts
Median Consumption = MEDIAN(cumUsed) across all accounts
Q1 (25th percentile) = Consumption at 25%
Q3 (75th percentile) = Consumption at 75%
```

**Revenue Distribution**
```
Min Revenue = MIN(billAmount) across all accounts
Max Revenue = MAX(billAmount) across all accounts
Median Revenue = MEDIAN(billAmount) across all accounts
```

### 3.4 Dimensional Breakdown

**By Area** (area field)
```
Per Area:
- Account count (total, ACTIVE, DISCONNECTED)
- Total consumption and % of total
- Total revenue and % of total
- Average consumption per account
- Status distribution (% ACTIVE)
- Classification distribution (% Residential, Commercial, etc.)
```

**By Route** (bookNo field)
```
Per Route:
- Account count
- Total consumption
- Total revenue
- Average consumption per account
- Route efficiency = Revenue / Consumption ($/unit)
- Status breakdown
- Peak consumption month
```

**By Classification** (rateCode field)
```
Per Classification:
- Account count
- Total consumption (category + individual)
- Total revenue
- Average consumption per account
- Consumption trend (month-over-month)
- Revenue per unit comparison to other classifications
```

**By Status**
```
ACTIVE accounts:
- Count, % of total
- Total consumption, avg per account
- Total revenue, avg per account
- Status trend (becoming active vs staying active)

DISCONNECTED accounts:
- Count, % of total
- Why disconnected (data field if available)
- Potential for reconnection

NEW accounts:
- Count (if status includes "NEW")
- Initial consumption patterns
- Classification distribution
```

### 3.5 Temporal Metrics

**Month-over-Month**
```
Feb 2026 Total = X
Mar 2026 Total = Y
Growth Rate = ((Y - X) / X) × 100 %

For each dimension (area, route, classification):
- Show which gained/lost consumption
- Show which had > 10% change
```

**Year-over-Year** (if multiple years available)
```
Same month, different years:
Feb 2026 vs Feb 2025 (if data exists)
Growth rate comparison
```

**Seasonal Patterns**
```
Average consumption by month
Identify peak/low consumption months
Account for data availability (Feb-May only in current dataset)
```

---

## 4. COMPARATIVE ANALYSIS: ALL ACCOUNTS vs ANOMALIES

### 4.1 Anomaly Impact Analysis

**Question**: "What % of the dataset is affected by anomalies?"

```
Total Accounts = A
Accounts with Anomalies = B
Anomaly Impact = (B / A) × 100 %

Example output:
"2,150 total accounts | 47 with anomalies (2.2%)"
```

### 4.2 Consumption Comparison

**Question**: "How much consumption is 'normal' vs 'anomalous'?"

```
Total Dataset Consumption = C
Anomalous Account Consumption = D
Normal Account Consumption = C - D

% Normal = (C - D) / C × 100 %
% Anomalous = D / C × 100 %

Example:
"Normal accounts: 94% of consumption | Anomalous: 6%"
```

### 4.3 Revenue Impact

**Question**: "How much revenue is affected by anomalies?"

```
Total Revenue = R
Revenue from anomalous accounts = R_anom
Revenue Loss/Risk = R_anom

% Revenue Impact = (R_anom / R) × 100 %
```

### 4.4 Status Patterns

**Question**: "Are anomalies correlated with status?"

```
% Anomalies in ACTIVE accounts = (anomalous active / total active) × 100
% Anomalies in DISCONNECTED accounts = (anomalous disconnected / total disconnected) × 100

Insight: If ACTIVE has 3% anomalies and DISCONNECTED has 0.5%, 
→ Problem is more prevalent in active accounts
```

### 4.5 Classification Patterns

**Question**: "Which customer types have anomalies?"

```
Anomaly Rate by Classification:
- Residential: 1.5% of residential accounts
- Commercial: 3.8% of commercial accounts
- Industrial: 5.2% of industrial accounts
- etc.

Insight: Which classifications need attention?
```

---

## 5. CONTEXTUAL INSIGHTS & MEANINGFUL ANALYSIS

### 5.1 Operational Health Indicators

**Healthy Dataset Baseline**
```
Normal Consumption Range (IQR based):
- Min: Q1 (25th percentile)
- Target: Median
- Max: Q3 (75th percentile)
- Outliers: Beyond Q3 or below Q1

Example display:
"Normal consumption: 15-45 m³/month (IQR) | Dataset median: 28 m³/month"
```

**Account Health Score**
```
For each account:
- Status: ACTIVE / DISCONNECTED / Other
- Consumption vs local average (area/classification)
- Revenue vs local average
- Trend: Increasing, Stable, Decreasing
- Anomaly risk: Yes/No
```

### 5.2 Efficiency Metrics

**Route Efficiency**
```
Per Route (bookNo):
- Revenue per account = Total Revenue / Account Count
- Consumption per account = Total Consumption / Account Count
- Revenue per unit water = Total Revenue / Total Consumption
- Account density per route
- Peak efficiency = (Revenue per unit) × (Account Count)

Benchmark: Compare each route to district average
```

**Area Performance**
```
Per Area:
- Revenue generation ranking
- Consumption profile vs other areas
- Account concentration (accounts per area)
- Growth trend (month-over-month)
- Status health (% ACTIVE)
```

### 5.3 Trend Analysis

**Consumption Trends**
```
Dataset-wide:
- Feb → Mar: +X% (growth/decline)
- Mar → Apr: +Y%
- Apr → May: +Z%

Per dimension:
- Which areas growing?
- Which routes declining?
- Which classifications increasing consumption?
```

**Revenue Trends**
```
Same as consumption, but for billAmount
Identify divergence: Consumption up, Revenue down = billing issue
```

**Account Movement**
```
New connections: February → May
Disconnections: February → May
Reconnections: DISCONNECTED → ACTIVE status changes
```

### 5.4 Risk & Opportunity Indicators

**Revenue at Risk**
```
Disconnected accounts:
- Count
- Previous consumption (if available)
- Potential revenue if reconnected
- Months disconnected (duration)

Example: "847 disconnected accounts worth ~$125K annual revenue"
```

**Growth Opportunity**
```
Areas with high account growth
Classifications with rising consumption
New connections trend

Example: "Area X added 23 new accounts (highest) with 15% higher avg consumption"
```

**Operational Concerns**
```
Routes with high disconnection rates
Areas with declining revenue
Sudden consumption drops in formerly stable accounts
```

---

## 6. INTEGRATION WITH EXISTING SYSTEMS

### 6.1 Alignment with Anomaly System

**Separation of Concerns**
```
ANOMALY DETECTION (unchanged):
├─ Identify sudden spikes, zero usage, sudden drops
├─ Flag ~2% of accounts as anomalous
├─ Create alerts for technicians
└─ Focus: Exception handling

ANALYTICS (new):
├─ Analyze full dataset trends
├─ Provide baseline statistics
├─ Compare anomalies to normal
└─ Focus: Understanding the whole picture
```

**Data Flow**
```
GeoJSON files
├─ → Anomaly Detection (separate, unchanged)
├─ → Analytics Page (comprehensive)
│   ├─ Aggregation: All accounts
│   ├─ Comparison: Normal vs Anomalous
│   ├─ Insights: Trends, distributions
│   └─ Filtering: By area, route, status, classification
└─ → Dashboard (anomaly-focused KPIs only)
```

### 6.2 Alignment with Analytics Plan (ANALYTICS-PLAN.md)

The Master Prompt enforces compliance with:

**Phase 1 - Temporal Aggregation**
- ✅ Month/year grouping
- ✅ All metrics by temporal periods
- ✅ KPI cards with holistic data

**Phase 2 - Multi-Dimensional Analysis**
- ✅ Consumption by area, route, classification, status
- ✅ Revenue by same dimensions
- ✅ Comparison of dimensions

**Phase 3 - Advanced Filtering**
- ✅ Include all accounts in filters
- ✅ AND logic combinations
- ✅ Real-time aggregation

**Phase 4 - Insights & Reporting**
- ✅ Smart insights beyond anomalies
- ✅ Trends detection
- ✅ Comparative analysis

---

## 7. IMPLEMENTATION CHECKLIST

### Data Coverage Checklist

- [ ] All 4 GeoJSON files (Feb-May 2026) included in analysis
- [ ] No account filtering (except by user-selected filters)
- [ ] All status values represented (ACTIVE, DISCONNECTED, NEW, Renewed, etc.)
- [ ] All 25 classifications included
- [ ] Accounts with $0 consumption included
- [ ] Disconnected accounts included (not hidden)
- [ ] No "hardcoded" anomaly filtering in analytics aggregation

### Comparative Analysis Checklist

- [ ] Total account count displayed
- [ ] Anomaly impact % calculated (anomalous / total)
- [ ] Consumption comparison (normal % vs anomalous %)
- [ ] Revenue comparison (normal % vs anomalous %)
- [ ] Status distribution shown
- [ ] Classification distribution shown
- [ ] Insights compare dataset health vs anomaly exceptions

### Contextual Logic Checklist

- [ ] Total consumption metric (all + by status)
- [ ] Average consumption per account
- [ ] Consumption distribution (min, median, max, quartiles)
- [ ] Status breakdown (% ACTIVE, % DISCONNECTED)
- [ ] Account health score or status indicator
- [ ] Route efficiency metric (revenue per unit)
- [ ] Area performance ranking
- [ ] Trend analysis (month-over-month growth %)
- [ ] Revenue at risk (disconnected accounts)
- [ ] Growth opportunity indicators

### Meaningful Insights Checklist

- [ ] Baseline statistics provided (median, IQR ranges)
- [ ] Operational efficiency metrics (route, area)
- [ ] Anomaly impact contextualized (% of dataset)
- [ ] Trend visualization (month-over-month, year-over-year if available)
- [ ] Account movement tracking (new, disconnected, reconnected)
- [ ] Risk indicators highlighted
- [ ] Growth opportunities identified
- [ ] Insights go beyond "anomaly count" (e.g., "why" and "impact")

### Integration Checklist

- [ ] Analytics uses `staticDataService.js` for aggregation
- [ ] No changes to anomaly detection logic
- [ ] No changes to authentication or map features
- [ ] Analytics page separates normal analysis from anomaly context
- [ ] Filters work independently (not affecting dashboard/map anomalies)
- [ ] Temporal selection (month/year) independent from other features
- [ ] All changes isolated to `src/pages/Analytics.jsx` and analytics components

---

## 8. SCOPE BOUNDARIES

### ✅ IN SCOPE (Analytics Page Only)

```
✅ Analytics.jsx page
✅ Consumption/Revenue/Area/Route analytics components
✅ Filter panel for analytics
✅ Smart insights module
✅ staticDataService analytics methods (new methods only)
✅ KPI cards for analytics dashboard
✅ Temporal selection UI
✅ Chart visualizations for analytics
```

### ❌ OUT OF SCOPE (DO NOT MODIFY)

```
❌ Anomaly detection algorithm
❌ Anomaly dashboard KPIs
❌ Dashboard.jsx page
❌ Anomaly chart components
❌ Map rendering (Leaflet, markers)
❌ Authentication system
❌ AdminUsers panel
❌ API routes (auth, admin)
❌ Database/Firestore operations
❌ RateCode mapping (already exists in rateCodeMap.js - use, don't modify)
```

---

## 9. SUCCESS CRITERIA

### Data Coverage Success
- ✅ Analytics shows 100% of accounts from all GeoJSON files
- ✅ No accounts hidden or pre-filtered at aggregation level
- ✅ Anomalous accounts included in all calculations with separate anomaly comparison
- ✅ All status values represented in breakdown

### Comparative Analysis Success
- ✅ Page clearly shows "% of accounts with anomalies"
- ✅ Consumption comparison visible (normal vs anomalous %)
- ✅ Revenue impact of anomalies calculated
- ✅ User can see if anomalies are widespread (10%) or isolated (1%)

### Contextual Insights Success
- ✅ Baseline metrics provided (median, ranges)
- ✅ Operational metrics beyond counts (efficiency, ranking)
- ✅ Trends visible (month-over-month, comparisons)
- ✅ "What to investigate" is clear (opportunities and risks)
- ✅ Insights are actionable (e.g., "Route B generating 15% less revenue despite +5% consumption")

### Integration Success
- ✅ Analytics page independent from anomaly system
- ✅ No breaking changes to dashboard or map
- ✅ No authentication issues
- ✅ Anomaly logic untouched
- ✅ Analytics-specific filters isolated (don't affect other pages)

---

## 10. REFERENCE DOCUMENTS

- **ANALYTICS-PLAN.md** - Implementation roadmap (phases, tasks, components)
- **FIRESTORE-SCHEMA.md** - Data structure (if using cloud for users)
- **AUTH-IMPLEMENTATION.md** - Permission checks (manager analytics access)
- **rateCodeMap.js** - Classification mappings (use existing, don't modify)
- **staticDataService.js** - Current GeoJSON parsing (extend, don't replace)

---

## 11. EXECUTION FLOW

### Data Pipeline
```
GeoJSON files (2026-02 through 2026-05)
    ↓
staticDataService.js (aggregate + normalize)
    ├─ getConsumptionMetrics() → all accounts, all statuses
    ├─ getRevenueMetrics() → all accounts, all statuses
    ├─ getAnomalyComparison() → NEW: normal vs anomalous breakdown
    ├─ getAccountDistribution() → status/classification breakdown
    └─ getTrendAnalysis() → month-over-month, year-over-year
    ↓
Analytics.jsx (apply user filters + temporal selection)
    ├─ Filter by area, route, classification, status (AND logic)
    ├─ Select month/year view
    ├─ Compute filtered metrics
    └─ Render analytics modules
    ↓
Components (visualization)
    ├─ ConsumptionAnalytics
    ├─ RevenueAnalytics
    ├─ AreaAnalytics
    ├─ RouteAnalytics
    ├─ StatusClassificationAnalytics
    └─ SmartInsights
```

### User Interaction Flow
```
User opens Analytics page
    ↓
Page loads all GeoJSON data
    ↓
Display full dataset KPIs (all accounts, all statuses)
    ↓
User applies filters (optional)
    ├─ Select area(s) → recalculate all metrics
    ├─ Select status(es) → recalculate all metrics
    ├─ Select classification(s) → recalculate all metrics
    └─ Select month/year → show temporal view
    ↓
Charts update in real-time
    ↓
SmartInsights module shows comparative analysis:
    ├─ "X% of dataset is anomalous"
    ├─ "Normal accounts: Y% of consumption"
    ├─ "Revenue at risk: $Z if disconnected accounts reconnect"
    └─ "Trend: +N% consumption growth month-over-month"
```

---

## 12. FINAL NOTES

### Philosophy
This analytics page is NOT an anomaly detector. It's an **understanding tool**. 

Users should be able to answer:
- "What is my baseline?" → Median, quartiles, normal ranges
- "How much is the dataset?" → Total accounts, total consumption, total revenue
- "What's trending?" → Month-over-month changes, growth indicators
- "How bad is the anomaly problem?" → % of accounts, % of consumption, % of revenue
- "Where should I focus?" → Which areas, routes, classifications need attention

### Non-Negotiable Constraints
1. ✅ **All accounts included** - No pre-filtering toward anomalies
2. ✅ **Separate from anomaly logic** - Independent system, independent data flow
3. ✅ **Comparative context** - Always show anomalies as "% of dataset"
4. ✅ **Actionable insights** - Trends, risks, opportunities, not just counts
5. ✅ **Temporal awareness** - All metrics grouped by month/year

---

**Master Prompt Version**: v1.0  
**Created**: 2026-06-11  
**Status**: Ready for Phase 1 Implementation
