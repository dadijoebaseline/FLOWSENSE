# RISKS

**Analysis Date:** 2026-05-14 (updated)

1) Committed build artifacts (`dist/`) in repo
- Files: `dist/index.html`, `dist/assets/*`
- Impact: Confusing diffs, merge conflicts, larger repo size
- Difficulty: low; Impact: medium
- Recommendation: Remove `dist/` from repo, add to `.gitignore`, use CI to build artifacts. (difficulty: low)
- Note: Deployment was performed using Vercel CLI from this branch; production site is live despite `dist/` being present.
- Confidence: high

2) CI / automated tests coverage
- Status: Basic unit tests added (Vitest) for parsing and detection.
- Remaining gap: No CI workflow to run tests on push/PRs.
- Impact: regressions may slip into PRs
- Recommendation: Add GitHub Actions to run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`.
- Confidence: high

3) No runtime schema validation despite `entities/*.json` and `zod` dependency
- Files: `entities/*.json`, `package.json` (zod)
- Impact: malformed GeoJSON may produce silent errors or incorrect anomalies
- Recommendation: Add runtime validation using `zod` or AJV in `src/lib/staticDataService.js` or `anomalyDetection.js`.
- Confidence: medium

4) External asset fetching without robust error handling
- Files: `src/lib/staticDataService.js` (fetchGeoJSONFile now records errors and returns `__error`)
- Impact: UI shows no data and only console warnings; users may be unaware
- Recommendation: Surface errors in UI (Toaster/banners), add retry/backoff, and test harness.
- Status: Banner added to AppLayout to show dataset load errors.
- Confidence: high

5) Dependency maintenance concerns
- Files: `package.json` (moment, vaul, baseline-browser-mapping)
- Impact: security/size/maintenance overhead
- Recommendation: Audit dependencies, replace `moment` with `date-fns`, evaluate `vaul` usage.
- Confidence: medium

6) Remaining gaps in anomaly logic testing
- Files: `src/lib/anomalyDetection.js` (core logic)
- Impact: Edge cases (meter rollovers, missing history) might need additional tests
- Recommendation: Add tests for meter reset fallback and zero-consumption scenarios.
- Confidence: high

Assumption: Static app variant deliberately uses static GeoJSON and a demo auth provider. If backend variant exists elsewhere, some recommendations may need adjustment. (Confidence: medium)