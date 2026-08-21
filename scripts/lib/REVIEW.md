# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish` after synchronization with current `develop`.
- Current integration state: the branch is ahead of `develop` and no longer behind it. The synchronized `develop` baseline is `13ae220900a2a724c867b01b5eb1f045c2a1d857`.
- Pass C is reviewed against `docs/testing/verify-unit-impact-correction.md`, the current post-sync branch tree, and the claimed real-resolver proof.

## Blockers

### B1 — exact external ownership is not status-safe for deleted/renamed inputs

Owner: `scripts/lib/unitRisk.ts`

Problem: exact external mappings are currently applied only in the `added | modified` branch of `resolveUnitPlan()`. Deleted paths and both sides of renames run infrastructure/scan handling and then leave that branch before `UNIT_FILE_AS_DATA_MAPPINGS` is consulted.

Confirmed false-negative class:

- deleting or renaming `PRIVACY.md` can omit `DataStoragePrivacyPane.test.ts`;
- deleting or renaming `.github/workflows/verify.yml`, `release.yml`, or `deploy-branch.yml` can omit their fixed-path workflow tests;
- deleting or renaming the root `.gitignore` can omit `scripts/agentEnvironment.test.mjs`.

These paths are not ordinary unit-source shapes, so the existing deleted/renamed ordinary-source fallback does not rescue them. A focused unit plan can therefore resolve to `skip` even though a surviving Vitest owner observes that exact repository path/existence contract.

Required final state:

- exact external ownership is evaluated status-aware for every changed path side where the exact source relation is deterministically known;
- `added` and `modified` preserve current behavior;
- `deleted` exact external inputs select their surviving exact owner(s), or conservatively full only when ownership cannot be represented safely;
- `renamed` evaluates both old and new paths and preserves any exact owner attached to either side; the existing unsafe ordinary-source rename fallback may still dominate when applicable;
- current source existence is not required to recognize a fixed-path external relation whose contract can fail because the path disappeared;
- add independent planner proof for at least one non-ordinary external deletion and rename, including a negative case that would previously have resolved to `skip`.

### B2 — the mandatory Playwright inventory owner is red against the current config

Owner: `playwright.lanes.test.ts`.

Pass C deliberately routes Playwright spec-inventory changes to `playwright.lanes.test.ts` as a bounded-scan owner. The real-resolver acceptance case for `tests/e2e/appSmoke.spec.ts` therefore requires this test to be green.

Current repository contract:

- `playwright.config.ts` owns shared subtree ignores at `projects[*].testIgnore` for both desktop and mobile projects;
- `playwright.lanes.test.ts` still asserts top-level `appConfig.testIgnore`.

The production config is already correct and must not be changed merely to satisfy this stale assertion.

Required final state:

- correct the test to assert the actual current project-level application-lane ignore contract;
- prove both desktop and mobile application projects keep `storybook/**`, `visual/**`, and `release/**` excluded while retaining their project-specific applicability ignores;
- preserve all other lane-disjointness assertions;
- rerun the real focused `tests/e2e/appSmoke.spec.ts` unit resolver case and confirm every selected owner, including `playwright.lanes.test.ts`, is green.

## Major issues

### M1 — Playwright scan-owner predicate is broader than the test's real scan

Owner: `scripts/lib/unitRisk.ts`.

`UNIT_SCAN_OWNERS` currently reuses `isPlaywrightOnlyProofPath` for `playwright.lanes.test.ts`. That helper intentionally classifies every `tests/e2e/**/*.spec.ts` as Playwright-owned proof, but the lane test's real filesystem inventory is narrower:

- root application `tests/e2e/*.spec.ts` non-recursively;
- `tests/e2e/storybook/**/*.spec.ts`;
- `tests/e2e/visual/**/*.spec.ts`;
- `tests/e2e/release/**/*.spec.ts`;
- colocated `src/**/*.browser.spec.ts`;
- colocated `src/**/*.visual.spec.ts`.

An arbitrary nested path such as `tests/e2e/foo/bar.spec.ts` is therefore over-selected as observed by `playwright.lanes.test.ts` even though the test does not enumerate that population.

Required final state:

- give `playwright.lanes.test.ts` a dedicated narrow scan predicate matching exactly its real enumerated populations;
- keep `isPlaywrightOnlyProofPath` unchanged for the separate ordinary-Vitest exclusion responsibility;
- prove at least one positive path from every materially distinct lane population and one adjacent negative nested `tests/e2e/<other-subtree>/*.spec.ts` path.

## Post-sync audit requirement

The branch is now synchronized with `develop`; the previous integration prerequisite is resolved.

The synchronized `develop` commit introduced directory/repository-state production code and additional Vitest tests. Targeted architect inspection of that commit found no new obvious `node:fs`, `readFileSync`, `readdir`, `existsSync`, or runtime ESLint-style repository-observation mechanism. This is evidence, not the audit boundary.

Before closing B1/M1, the dedicated test-author must rerun the semantic external-ownership audit against the complete current post-sync Vitest population and report either:

- newly confirmed external/scan owner relations and their truthful representation; or
- `none`, with the audited mechanisms/population stated explicitly.

Do not reopen ordinary Vitest import ownership or add mappings without current repository evidence.

## Resolved findings

- Repository-wide ordinary `vitest related` inputs are no longer restricted to `src/config/scripts`.
- Exact external ownership includes runtime-discovered ESLint config, current workflow readers, and the fixed absence contract for added/modified inputs.
- Redundant import-reachable `viteBuildDate.test.mjs` ownership was removed from exact mappings.
- The nine previously audited bounded scan/inventory owners are represented additively.
- Pass A failure-detail extraction is resolved.
- The stale visual-owner proof is resolved.
- Pass F release-impact timeout ownership is resolved.
- Previous release-impact false negatives and proof-only over-selection remain resolved.
- Branch synchronization with current `develop` is complete.

## Verification required for closure

- fresh independent proof for B1, B2, and M1 before production planner changes;
- focused unit planner proof for status-aware exact ownership and exact Playwright scan boundaries;
- real focused resolver proof for `tests/e2e/appSmoke.spec.ts` after the stale lane test is corrected;
- post-sync external-ownership audit result recorded in the handoff;
- no repository-wide/full local verification ritual.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not reopen mutation/release/change-classification architecture.
- Do not introduce a general repository dependency graph, generated per-file scan mappings, or a generic status/ownership framework.
