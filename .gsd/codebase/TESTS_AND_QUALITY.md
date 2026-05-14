# TESTS AND QUALITY

**Analysis Date:** 2026-05-14

Test framework
- No unit or integration tests detected. Search for `*.test.*`/`*.spec.*` returned none. (confidence: high)

Linting & formatting
- ESLint present and configured via `package.json` scripts (`npm run lint`, `npm run lint:fix`). See `package.json` and `eslint` devDependencies.
- Type checking: `npm run typecheck` runs `tsc -p ./jsconfig.json` — project uses `checkJs` in `jsconfig.json` for lightweight checks.

Known gaps
- Missing automated tests (unit, integration, E2E). Critical areas missing coverage:
  - `src/lib/anomalyDetection.js` — core business logic (priority: high)
  - `src/lib/staticDataService.js` — data ingestion and error cases (priority: high)
  - `src/components/map/AnomalyMap.jsx` and `src/components/dashboard/*` — render tests (priority: medium)

Suggested quick wins (with difficulty & impact)
- Add unit tests for anomaly detection using Jest or Vitest (difficulty: low, impact: high).
- Add test runner (Vitest) and basic test configuration, plus GitHub Action to run tests on PRs (difficulty: medium, impact: high).
- Add snapshot or visual regression tests for critical UI (difficulty: medium, impact: medium).
- Add integration test to fetch and parse a sample GeoJSON file and verify anomalies (difficulty: medium, impact: high).

Recommendations
- Use `vitest` (lightweight and Vite-friendly) and `@testing-library/react`.
- Create `tests/` or co-locate tests with components: `src/lib/__tests__/anomalyDetection.test.js`.
- Enforce type checking and linting in CI.

Confidence: high for absence of tests and presence of lint/typecheck scripts. Medium for suggested priorities.