# RISKS

**Analysis Date:** 2026-05-14

1) Committed build artifacts (`dist/`) in repo
- Files: `dist/index.html`, `dist/assets/*`
- Impact: Confusing diffs, merge conflicts, larger repo size
- Difficulty: low; Impact: medium
- Recommendation: Remove `dist/` from repo, add to `.gitignore`, use CI to build artifacts. (difficulty: low)
- Confidence: high

2) No CI / automated tests
- Files: absent (no `.github/workflows`)
- Impact: regressions may slip into PRs
- Difficulty: medium; Impact: high
- Recommendation: Add GitHub Actions to run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` (once tests added).
- Confidence: high

3) No runtime schema validation despite `entities/*.json` and `zod` dependency
- Files: `entities/*.json`, `package.json` (zod)
- Impact: malformed GeoJSON may produce silent errors or incorrect anomalies
- Difficulty: medium; Impact: high
- Recommendation: Add runtime validation using `zod` or AJV in `src/lib/staticDataService.js` or `anomalyDetection.js`.
- Confidence: medium

4) External asset fetching without robust error handling
- Files: `src/lib/staticDataService.js` (fetchGeoJSONFile returns `{ features: [] }` on error)
- Impact: UI shows no data and only console warnings; users not notified
- Difficulty: low; Impact: medium
- Recommendation: Surface errors in UI (Toaster), add retry/backoff, and test harness.
- Confidence: high

5) Dependency maintenance concerns
- Files: `package.json` (moment, vaul, baseline-browser-mapping)
- Impact: security/size/maintenance overhead
- Difficulty: medium; Impact: low-to-medium
- Recommendation: Audit dependencies, replace `moment` with `date-fns`, evaluate `vaul` usage.
- Confidence: medium

6) Missing tests around core algorithm
- Files: `src/lib/anomalyDetection.js` (critical logic untested)
- Impact: Risk of incorrect anomaly classification
- Difficulty: low; Impact: high
- Recommendation: Add unit tests for `detectAnomaliesWithHistory` and `parseGeoJSON`.
- Confidence: high

7) No secrets or CI configs detected, but check if any future env vars are documented
- Files: None found for env usage
- Impact: low; Recommendation: Document expected env vars if integrating external APIs.
- Confidence: medium

Assumption: Static app variant deliberately uses static GeoJSON and a demo auth provider. If backend variant exists elsewhere, some recommendations may need adjustment. (Confidence: medium)