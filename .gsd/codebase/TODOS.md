# TODOS

**Analysis Date:** 2026-05-14 (updated)

Priority tasks (high → low)

1. Unit tests for anomaly detection (DONE)
- Files: `src/lib/anomalyDetection.js`
- Why: core business logic required tests.
- Status: Vitest added and basic tests implemented in `src/lib/__tests__/anomalyDetection.test.js`.
- Difficulty: low; Impact: high

2. Add CI pipeline (GitHub Actions) to run lint/typecheck/tests on PRs (high)
- Why: prevent regressions and ensure build reproducibility
- Difficulty: medium; Impact: high

3. Remove `dist/` from repo and configure CI/CD to produce artifacts (medium)
- Files: `dist/`
- Note: `dist/` was committed and used for direct deploy; recommended to remove and let CI/Vercel build
- Difficulty: low; Impact: medium

4. Add runtime validation for GeoJSON -> WaterAccount using `zod` or AJV (medium)
- Files: `src/lib/staticDataService.js`, `src/lib/anomalyDetection.js`, `entities/*.json`
- Difficulty: medium; Impact: high

5. Improve UI visibility for data issues (toaster, banner counts) (medium)
- Files: `src/components/layout/AppLayout.jsx`, `src/components/ui/toaster`
- Status: Banner added to show dataset load errors; consider adding counts for skipped rows and insufficient-history entries.
- Difficulty: low; Impact: medium

6. Audit and prune dependencies (moment → date-fns migration) (low)
- Files: `package.json`
- Difficulty: medium; Impact: low

7. Add tests for `staticDataService.getDatasets()` and `getAnomalies()` (low)
- Difficulty: low; Impact: medium

8. Document developer workflow and environment variables in `README.md` (low)

Each TODO item is actionable; prioritize adding CI and removing committed build artifacts next. (Confidence: high)