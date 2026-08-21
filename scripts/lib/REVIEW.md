# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish`, with Pass C re-reviewed against `docs/testing/verify-unit-impact-correction.md`, the final branch implementation, and the claimed real-resolver proof.

## Blockers

### B1 — exact external ownership is not status-safe for deleted/renamed inputs

Owner: `scripts/lib/unitRisk.ts`

Problem: exact external mappings are applied only in the `added | modified` branch of `resolveUnitPlan()`. Deleted paths and both sides of renames run infrastructure/scan handling and then return before `UNIT_FILE_AS_DATA_MAPPINGS` is consulted.

Confirmed false-negative class:

- deleting or renaming `PRIVACY.md` can omit `DataStoragePrivacyPane.test.ts`;
- deleting or renaming `.github/workflows/verify.yml`, `release.yml`, or `deploy-branch.yml` can omit their fixed-path workflow tests;
- deleting or renaming the root `.gitignore` can omit `scripts/agentEnvironment.test.mjs`.

These paths are not ordinary unit-source shapes, so the current deletion/rename fallback does not rescue them. A focused unit plan can therefore resolve to `skip` even though a surviving Vitest owner observes that exact repository path/existence contract.

Required final state:

- exact external ownership is evaluated status-aware for every changed path side where the exact source relation is deterministically known;
- `added`/`modified` keep selecting exact owners as today;
- `deleted` exact external inputs select their surviving exact owner(s), or conservatively full only where the relation cannot be represented safely;
- `renamed` changes evaluate both old and new paths: if either side is an exact external source, preserve that exact owner relation; ordinary unsafe rename fallback may still dominate when applicable;
- source existence must not be required to recognize a fixed-path external owner whose contract can fail because the path disappeared;
- add independent proof for at least one non-ordinary external source deletion and rename (workflow/Markdown/.gitignore class), not only ordinary `.ts/.css` deletion fallback.

### B2 — the mandatory Playwright inventory scan owner is currently red

Owner: `playwright.lanes.test.ts` / current Playwright config proof

Problem: Pass C now deliberately routes Playwright spec inventory changes to `playwright.lanes.test.ts` as a required bounded-scan owner. The claimed real-resolver proof for `tests/e2e/appSmoke.spec.ts` therefore depends on this test being green.

Current repository evidence contradicts the handoff's "all passed" statement:

- `playwright.config.ts` defines the shared subtree ignores inside each project via `projects[*].testIgnore`;
- `playwright.lanes.test.ts` still asserts `appConfig.testIgnore` at the top level.

That assertion is stale on both the finish branch and current `develop`. The underlying failure is pre-existing, but once this PR makes `playwright.lanes.test.ts` a required owner for spec-inventory changes, the verifier finish cannot claim a green real-resolver acceptance case while that owner is red.

Required final state:

- correct the stale test to assert the actual current application-lane ignore contract at the truthful config boundary (project-level ignores), without changing Playwright production behavior merely to satisfy the old assertion;
- keep the lane-disjointness contract intact for desktop and mobile projects;
- rerun the `tests/e2e/appSmoke.spec.ts` focused unit resolver probe and confirm every selected owner, including `playwright.lanes.test.ts`, is green.

## Major issues

### M1 — Playwright scan-owner predicate is broader than the test's real scan

Owner: `scripts/lib/unitRisk.ts`

`UNIT_SCAN_OWNERS` uses `isPlaywrightOnlyProofPath` for `playwright.lanes.test.ts`. That helper matches every `tests/e2e/**/*.spec.ts`, but `playwright.lanes.test.ts` actually enumerates:

- root application `tests/e2e/*.spec.ts` non-recursively;
- `tests/e2e/storybook/**/*.spec.ts`;
- `tests/e2e/visual/**/*.spec.ts`;
- `tests/e2e/release/**/*.spec.ts`;
- colocated `src/**/*.browser.spec.ts` and `src/**/*.visual.spec.ts`.

An arbitrary nested path such as `tests/e2e/foo/bar.spec.ts` is therefore classified as observed by `playwright.lanes.test.ts` even though that test's current filesystem scan does not enumerate it. This is focused over-selection rather than a false negative, but it contradicts the accepted rule that bounded-scan predicates mirror the real owning scan rather than a broader adjacent category.

Required final state: give the `playwright.lanes.test.ts` scan owner its own narrow predicate matching exactly the populations that test currently enumerates. Keep `isPlaywrightOnlyProofPath` for the separate ordinary-Vitest exclusion concern.

## Resolved findings

- Repository-wide ordinary `vitest related` inputs are no longer restricted to `src/config/scripts`.
- Exact external ownership now includes runtime-discovered ESLint config, current workflow readers, and the fixed absence contract.
- Redundant import-reachable `viteBuildDate.test.mjs` ownership was removed from exact mappings.
- The nine audited bounded scan/inventory owners are represented additively.
- Pass A failure-detail extraction is resolved.
- The stale visual-owner proof is resolved.
- Pass F release-impact timeout ownership is resolved.
- Previous release-impact false negatives and proof-only over-selection remain resolved.

## Integration prerequisite

The finish branch is currently one commit behind `develop` (`13ae220900a2a724c867b01b5eb1f045c2a1d857`), which contains the directory/repository-state change and additional Vitest tests. Before final acceptance/PR CI, sync the finish branch with current `develop`, rerun the external-ownership audit against the resulting tree, and refresh only benchmark/proof affected by that integration.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not reopen mutation/release/change-classification architecture.
- Do not introduce a general repository dependency graph or generated per-file scan mappings.
