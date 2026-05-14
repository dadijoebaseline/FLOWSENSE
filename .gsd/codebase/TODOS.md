# TODOS

**Analysis Date:** 2026-05-14

Priority tasks (high → low)

1. Add unit tests for anomaly detection (high priority)
- Files: `src/lib/anomalyDetection.js`
- Why: core business logic with no tests.
- Difficulty: low; Impact: high
- Suggested tasks: add `vitest`, create `src/lib/__tests__/anomalyDetection.test.js`.

2. Add CI pipeline (GitHub Actions) to run lint/typecheck/tests on PRs (high)
- Why: prevent regressions and ensure build reproducibility
- Difficulty: medium; Impact: high

3. Remove `dist/` from repo and configure CI/CD to produce artifacts (medium)
- Files: `dist/`
- Difficulty: low; Impact: medium

4. Add runtime validation for GeoJSON -> WaterAccount using `zod` or AJV (medium)
- Files: `src/lib/staticDataService.js`, `src/lib/anomalyDetection.js`, `entities/*.json`
- Difficulty: medium; Impact: high

5. Surface data fetch errors to UI (toaster) and add retry logic (medium)
- Files: `src/lib/staticDataService.js`, `src/components/ui/toaster` (used in `src/App.jsx`)
- Difficulty: low; Impact: medium

6. Audit and prune dependencies (moment → date-fns migration) (low)
- Files: `package.json`
- Difficulty: medium; Impact: low

7. Add basic tests for `staticDataService.getDatasets()` and `getAnomalies()` (low)
- Difficulty: low; Impact: medium

8. Document developer workflow and environment variables in `README.md` (low)

Each TODO item is actionable; prioritize writing tests and adding CI first. (Confidence: high)