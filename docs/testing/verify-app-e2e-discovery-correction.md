# Verify application-E2E discovery ownership

Status: **architecture redesigned and ready for implementation; local planner symptom and probe-safety defect already corrected**.

This document is the ready architecture handoff for the application-E2E discovery/selection boundary. `docs/testing/architecture.md` remains canonical testing policy; `docs/testing/verify-target-architecture.md` owns the wider verifier architecture; `docs/testing/verify-e2e-planner-precision.md` remains the product-scenario planning contract.

## Goal

Keep one code-level definition of the application-E2E file population across physical Playwright collection and verifier ownership:

```text
application E2E
→ direct tests/e2e/*.spec.ts only
```

The same contract must drive:

- `playwright.config.ts` physical collection;
- `scripts/lib/e2eRisk.ts` direct changed-spec classification;
- `scripts/lib/e2eProjectApplicability.ts` registry validation;
- `scripts/lib/unitRisk.ts` bounded root-app inventory ownership.

Scenario mappings remain separately owned by `E2E_SCENARIO_SCOPES`.

## Confirmed current state and cause

The physical Playwright config is root-only:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

A previous correction has also made `e2eRisk.ts:isAppE2ESpecPath()` root-only and has made the real-collector probes collision-safe. Those changes are accepted and must be preserved.

The architectural issue remains: the same root-only fact is still independently represented by `playwright.config.ts`, `e2eRisk.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts`. Multiple correction rounds already exposed drift between those copies. Per root `AGENTS.md`, another local predicate patch is not sufficient; duplicated ownership must be removed.

The existing filtered collector proof currently supplies only the nested probe and expects `No tests found`. That proves the nested file is not collected, but the final proof should be stronger and non-ambiguous: pass one real root app spec together with the nested probe, require successful collection of the root spec, and still prove the nested probe is absent.

## Non-goals

- no nested application-E2E convention;
- no application spec moves;
- no change to product scenarios or `E2E_SCENARIO_SCOPES`;
- no change to desktop/mobile applicability data;
- no Storybook, visual, release, unit-impact, mutation, retry, worker, timeout, or CI-topology redesign;
- no generic Playwright discovery registry, glob library, path taxonomy, or dependency graph.

## Affected scenarios

Only verifier/discovery scenarios change:

1. direct root app spec change → focused application E2E;
2. arbitrary nested `*.spec.ts` under `tests/e2e/**` → not application E2E;
3. genuine non-spec nested app-E2E helper outside reserved lanes → conservative full app E2E remains allowed;
4. malformed scenario/applicability metadata referencing a non-root app spec → invalid, not silently accepted;
5. canonical app-E2E path-contract change → full application E2E;
6. real collector proof → successful root collection while a nested filtered probe remains excluded, without overwriting/deleting unrelated repository content.

No product runtime behavior changes.

## Boundaries and ownership

| Owner | Responsibility |
| --- | --- |
| `scripts/lib/appE2EPaths.ts` | canonical application-E2E root/path-shape contract only |
| `playwright.config.ts` | physical Playwright execution using that contract |
| `scripts/lib/e2eRisk.ts` | product/source → app scenario planning and direct-spec/support classification |
| `scripts/lib/e2eProjectApplicability.ts` | app spec → desktop/mobile applicability |
| `scripts/lib/unitRisk.ts` | unit-impact ownership of repository scans; consumes the shared root-spec predicate |
| `playwright.lanes.test.ts` | independent real-collector/lane proof; never source of truth |

No FSD/product owner changes.

## Source of truth

Create one narrow pure module:

```text
scripts/lib/appE2EPaths.ts
```

Its public API is exactly:

```ts
APP_E2E_SPEC_DIR
APP_E2E_TEST_MATCH
isRootAppE2ESpecPath(filePath)
```

Required semantics:

```text
APP_E2E_SPEC_DIR
= tests/e2e

APP_E2E_TEST_MATCH
= **/tests/e2e/*.spec.ts

isRootAppE2ESpecPath(tests/e2e/appSmoke.spec.ts)
= true

isRootAppE2ESpecPath(tests/e2e/other/example.spec.ts)
= false
```

The module is pure: no filesystem access, scenario metadata, Playwright imports, or lane-specific reserved-subtree knowledge.

`playwright.config.ts` remains the physical executor. Real `playwright test --list` proof remains independent and must not use the shared predicate as its oracle.

## Minimum sufficient design

### 1. Shared root-app path contract

Add `scripts/lib/appE2EPaths.ts` with only the three exports above.

This abstraction is justified by observed drift: four consumers need the same invariant and independent implementations have already disagreed across correction rounds.

### 2. Physical config consumes the shared contract

`playwright.config.ts` derives application `testDir` from `APP_E2E_SPEC_DIR` and uses `APP_E2E_TEST_MATCH` for `testMatch`.

Resolved values stay exactly:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

Project `testIgnore` remains applicability-only.

### 3. Planner consumes the shared predicate

`e2eRisk.ts:isAppE2ESpecPath()` remains the public semantic concept but becomes a wrapper over `isRootAppE2ESpecPath()` rather than retaining its own path algorithm.

The already-correct behavior must be preserved:

```text
tests/e2e/appSmoke.spec.ts
→ app spec

tests/e2e/other/example.spec.ts
→ not app spec
→ not app support

tests/e2e/other/helper.ts
→ support
```

`isAppE2ESupportPath()` remains locally owned because support is a separate concept. Test/spec proof shapes must not be absorbed as support. Existing `*.testUtils.ts` helper behavior remains unchanged.

`validateE2EScenarioRegistry()` must validate scenario and standalone entries with the shared root predicate. Existing non-root Storybook/release/arbitrary specs must be invalid application metadata even when they exist on disk.

The local non-recursive filesystem scan may remain local because its `specDir` override is scanner behavior, not canonical path-shape ownership.

### 4. Applicability consumes the shared predicate

`e2eProjectApplicability.ts` removes its private duplicate `isRootAppE2ESpecPath()` and canonical root constants, importing the shared predicate/root instead.

Its local non-recursive filesystem scan may remain local for `specDir` test overrides.

### 5. Unit scan ownership consumes the shared predicate

`unitRisk.ts` removes its private duplicate root-app predicate and uses the shared `isRootAppE2ESpecPath()` for root application inventory owners.

The intentionally broader `isPlaywrightOnlyProofPath()` remains separate because it answers a different question: which Playwright proof paths must never become ordinary Vitest dependency inputs.

### 6. The new owner is full app-E2E infrastructure

A change to `scripts/lib/appE2EPaths.ts` can change physical collection and planner ownership, so `e2eRisk.ts` must classify it as full application-E2E infrastructure.

Do not make it full Storybook/visual/release impact merely because it lives under `scripts/lib/`.

### 7. Real collector proof stays independent

The already-implemented probe ownership is accepted:

- unique `mkdtempSync` nested directory under `tests/e2e/`;
- unique direct-root `*.test.mjs` probe;
- exclusive `wx` creation;
- exact tracked-file cleanup;
- non-recursive removal only of the invocation-owned temporary directory.

Preserve that safety design.

Strengthen only the filtered collector observation:

```text
filter args = real root app spec + nested probe
→ command succeeds
→ root spec collected
→ nested probe not collected
```

This proves CLI filtering can narrow the configured lane but cannot expand it.

## Simplest alternative considered and rejected

### Keep the now-correct local `e2eRisk.ts` predicate

Rejected.

The symptom is fixed, but independent canonical copies remain in config/applicability/unit ownership. That duplication is the observed cause of repeated drift.

### Generic discovery/registry framework

Rejected.

No current requirement needs generalized lane discovery. One tiny pure module for one repeated invariant is sufficient.

## Acceptance matrix

| Path / change | Expected application-E2E result |
| --- | --- |
| `tests/e2e/appSmoke.spec.ts` | root app spec; collect + focused direct selection |
| another direct `tests/e2e/*.spec.ts` | root app spec; must enter scenario/applicability ownership |
| `tests/e2e/other/example.spec.ts` | not app spec, not app support, not app-selected |
| `tests/e2e/other/helper.ts` | non-spec support; conservative full app E2E |
| `tests/e2e/example.test.ts` | not app spec/support |
| `tests/e2e/example.test.mjs` | not app E2E; Vitest when applicable |
| `tests/e2e/storybook/**` | Storybook behavior only |
| `tests/e2e/visual/**` | visual only |
| `tests/e2e/release/**` | release only |
| scenario registry references nested existing spec | invalid |
| applicability registry references nested existing spec | invalid |
| `scripts/lib/appE2EPaths.ts` changes | full application E2E |

## TEST IMPACT

Automated proof changes materially because scenario-metadata validation and filtered collector evidence change. Follow `test-first` with a fresh test-author context for those new assertions. Do not manufacture a RED for the already-fixed nested planner behavior.

### Contract 1 — preserve root-only planner behavior during ownership migration

- Primary proof: existing `scripts/lib/e2eRisk.test.ts` root-positive/nested-negative/support cases.
- Oracle: this document + real `playwright.config.ts`.
- RED: not applicable — the previous correction already made these assertions green.
- Must reject: reintroducing nested spec selection or converting nested spec to support while migrating ownership.

### Contract 2 — scenario metadata is root-only

- Primary proof: `scripts/lib/e2eRisk.test.ts`.
- Oracle: this document.
- Add a deterministic case using an existing non-root spec while preserving the complete current root registry, so the failure isolates metadata shape rather than missing registry coverage.
- Must reject: an existing Storybook/release/arbitrary nested spec being accepted as application scenario/standalone metadata.
- RED: required; current scenario validation does not generally reject every existing non-root spec.

### Contract 3 — canonical owner is full application-E2E infrastructure

- Primary proof: `scripts/lib/e2eRisk.test.ts`.
- Must reject: `scripts/lib/appE2EPaths.ts` resolving as non-infrastructure.
- RED: required; the path is not currently in the full-lane infrastructure set.

### Contract 4 — applicability remains root-only

- Primary proof: existing `scripts/lib/e2eProjectApplicability.test.ts` non-app-spec rejection.
- RED: not applicable — current behavior is already correct; migration must preserve it while removing the private predicate.

### Contract 5 — delegated collector alignment

- Primary proof: `playwright.lanes.test.ts`.
- Keep the independent real collector and collision-safe probe setup.
- Change the filtered invocation to include one real root app spec plus the nested probe; require success, root collection, and nested exclusion.
- RED: not required; this strengthens proof without changing physical collector behavior.

### Contract 6 — unit bounded-scan ownership

- Primary proof: existing `unitRisk.test.ts` root-app positive and nearby nested negative.
- RED: not applicable — ownership migration only; semantics must remain unchanged.

## Required verification

Focused feedback only:

```text
pnpm verify --only unit-tests --files \
  scripts/lib/appE2EPaths.ts \
  scripts/lib/e2eRisk.ts \
  scripts/lib/e2eRisk.test.ts \
  scripts/lib/e2eProjectApplicability.ts \
  scripts/lib/e2eProjectApplicability.test.ts \
  scripts/lib/unitRisk.ts \
  scripts/lib/unitRisk.test.ts \
  playwright.config.ts \
  playwright.lanes.test.ts
```

Run focused type-check if useful. Do not run browser E2E merely for discovery. Exact-head GitHub CI remains the final automatic gate.

## Forbidden

- reverting the already-correct root-only planner behavior or collision-safe probe ownership;
- local patch that leaves duplicate production root-app predicates in place;
- second scenario registry;
- recursive application scenario/applicability inventory;
- generic glob/path/discovery framework;
- importing Playwright into `appE2EPaths.ts`;
- moving specs;
- changing product scenarios, platform applicability data, retries, workers, timeouts, or CI topology;
- using the shared predicate as the only proof that Playwright collection is correct;
- weakening Storybook/visual/release isolation.

## Implementation readiness

- current prior correction: accepted as partial implementation;
- ownership: resolved;
- source of truth: resolved to `scripts/lib/appE2EPaths.ts`;
- public API: three verifier-only exports;
- proof ownership: resolved;
- unresolved blockers: none beyond implementation;
- verdict: **ready**.
