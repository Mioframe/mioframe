# Verify application-E2E discovery ownership

Status: **architecture redesigned and ready for implementation**.

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

## Confirmed current behavior and cause

The physical Playwright config is already root-only:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

Scenario/applicability filesystem scans are also non-recursive, but the same root-only fact is independently reimplemented in multiple modules. `e2eRisk.ts:isAppE2ESpecPath()` is still broader and accepts arbitrary nested non-reserved `tests/e2e/**/*.spec.ts` paths.

This is no longer a one-line local defect. Multiple correction rounds have exposed drift between duplicated representations of the same ownership fact. Per root `AGENTS.md`, further local patching is not the accepted approach.

The existing real-collector proof also creates fixed probe paths and recursively removes a generic directory, so its mutable test data is not safely owned.

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
5. real collector proof → same discovery evidence without overwriting/deleting unrelated repository content.

No product runtime behavior changes.

## Boundaries and ownership

| Owner | Responsibility |
| --- | --- |
| `scripts/lib/appE2EPaths.ts` | canonical application-E2E root/path-shape contract only |
| `playwright.config.ts` | physical Playwright execution using that contract |
| `scripts/lib/e2eRisk.ts` | product/source → app scenario planning and direct-spec/support classification |
| `scripts/lib/e2eProjectApplicability.ts` | app spec → desktop/mobile applicability |
| `scripts/lib/unitRisk.ts` | unit-impact ownership of repository scans; consumes the shared root-spec predicate |
| `playwright.lanes.test.ts` | independent real-collector/lane proof; must not become the source of truth |

No FSD/product owner changes.

## Source of truth

Create one narrow pure module:

```text
scripts/lib/appE2EPaths.ts
```

Its public API is exactly the minimum needed by current consumers:

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

`playwright.config.ts` remains the physical executor. Real `playwright test --list` proof is required to verify that Playwright interprets the shared `APP_E2E_TEST_MATCH` as intended; importing the same constant into a unit assertion is not sufficient proof of collector semantics.

## State shape

No persisted/runtime state. The new module contains immutable verifier path facts and one pure predicate.

## Public entry points

Only verifier/config code imports `scripts/lib/appE2EPaths.ts`. It is not product API and must not be exported through application barrels.

## Minimum sufficient design

### 1. Shared root-app path contract

Add `scripts/lib/appE2EPaths.ts` with only the three public facts above.

This is the smallest viable abstraction because four production/verifier consumers currently need the same root-app invariant and independent local implementations have already drifted across correction rounds.

### 2. Physical config consumes the shared contract

`playwright.config.ts` must derive its application `testDir` from `APP_E2E_SPEC_DIR` and use `APP_E2E_TEST_MATCH` for `testMatch`.

Project `testIgnore` remains applicability-only.

### 3. Planner consumes the shared predicate

`e2eRisk.ts:isAppE2ESpecPath()` becomes a semantic wrapper over `isRootAppE2ESpecPath()` rather than its own path implementation.

`validateE2EScenarioRegistry()` must reject registry/standalone entries that are not root application specs, using the same predicate. A nested existing file must not become valid scenario metadata merely because it exists.

`isAppE2ESupportPath()` remains locally owned because support is a different concept. It must preserve real nested non-spec helpers while excluding test/spec proof shapes from app support. At minimum:

```text
tests/e2e/other/helper.ts
→ support

tests/e2e/other/example.spec.ts
→ not support

tests/e2e/example.test.ts
→ not support
```

Existing `*.testUtils.ts` helper behavior is not changed merely because its name contains `test`.

Reserved Storybook/visual/release paths remain excluded exactly as today.

### 4. Applicability consumes the shared predicate

`e2eProjectApplicability.ts` removes its private duplicate `isRootAppE2ESpecPath()` and imports the shared predicate and root directory.

Its local filesystem scan may remain non-recursive because test overrides need an arbitrary `specDir`; it is a scan implementation, not another canonical path-shape contract.

### 5. Unit scan ownership consumes the shared predicate

`unitRisk.ts` removes its private duplicate root-app predicate and uses `isRootAppE2ESpecPath()` for the root app inventory scan owners.

The intentionally broader `isPlaywrightOnlyProofPath()` remains separate. It answers a different question: which Playwright proof paths must not become ordinary Vitest dependency inputs.

### 6. The new owner is full app-E2E infrastructure

A change to `scripts/lib/appE2EPaths.ts` can change both physical collection and planner ownership. `e2eRisk.ts` must therefore classify that module as full application-E2E infrastructure.

Do not make it full Storybook/visual/release impact merely because it lives under `scripts/lib/`.

### 7. Real collector proof stays independent and becomes safe

`playwright.lanes.test.ts` must continue to exercise the installed Playwright collector against the real `playwright.config.ts`.

It must not use the shared predicate to decide expected collector results.

Probe ownership:

- create a unique test-owned nested directory under `tests/e2e/` using a collision-safe primitive such as `mkdtempSync` with a non-hidden proof prefix;
- place one nested `*.spec.ts` probe inside that newly-created directory;
- create one unique direct-root `*.test.mjs` probe with exclusive creation (`wx` or equivalent);
- track exactly which paths were created;
- cleanup only those paths in `finally`;
- recursive cleanup is allowed only for the unique directory created by that invocation;
- never overwrite or delete a pre-existing generic path.

The filtered collector proof should include at least one real root app spec together with the nested probe filter so the command can succeed while proving the nested path still does not enter the configured lane.

## Simplest alternative considered and rejected

### Local `e2eRisk.ts` predicate fix only

Rejected.

It would make the current failing case green but preserve independent root-only implementations in `playwright.config.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts`. That exact duplication has already produced repeated planner/discovery drift, so the simpler-looking patch is no longer the simpler total system.

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
| scenario registry references nested `tests/e2e/other/x.spec.ts` | invalid |
| applicability registry references nested `tests/e2e/other/x.spec.ts` | invalid |
| `scripts/lib/appE2EPaths.ts` changes | full application E2E |

## Risk matrix

| Risk | Required protection |
| --- | --- |
| planner and collector drift again | shared production path contract + independent real collector proof |
| shared predicate/testMatch drift inside the new owner | positive/negative planner proof + real collector nested negative |
| nested spec reclassified as support | explicit support negative |
| support overcorrection suppresses real helper | nested helper positive → full |
| scenario metadata points at uncollectable spec | registry validation negative |
| proof mutates checkout | unique exclusive probes + exact cleanup |
| new abstraction grows into generic framework | public API limited to current three facts |

## Required test proof

Automated behavioral proof changes materially: use `test-first` and a fresh dedicated test-author context.

Primary proof owners:

- `scripts/lib/e2eRisk.test.ts`
  - root spec positive;
  - nested spec negative;
  - nested spec not support;
  - direct-root `.test.ts` not support;
  - nested helper support preserved;
  - nested scenario/standalone metadata rejected;
  - `appE2EPaths.ts` change is full-lane infrastructure;
- `scripts/lib/e2eProjectApplicability.test.ts`
  - existing nested/non-root applicability rejection remains green; update only if the shared-owner migration needs proof changes;
- `playwright.lanes.test.ts`
  - real root spec collected;
  - unique nested `*.spec.ts` not collected;
  - unique direct-root `*.test.mjs` not collected;
  - filtered collector invocation does not bypass root-only `testMatch`;
  - Storybook/visual/release remain outside app collection;
  - probe cleanup is collision-safe by construction.

Existing `unitRisk.test.ts` root-inventory positive/nearby-negative proof should remain semantically unchanged; implementation may adjust imports/comments only if required by removal of the duplicate predicate.

Meaningful RED is required for the current nested-spec planner classification. A separate RED is not required solely for test-harness collision safety.

## Required verification

Focused implementation feedback only:

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

Run focused type-check if useful for touched TypeScript.

Do not run a browser E2E suite merely for file discovery. Exact-head GitHub CI remains the final automatic gate.

## Forbidden

- local patch that leaves duplicate production root-app predicates in place;
- second scenario registry;
- recursive application scenario/applicability inventory;
- generic glob/path/discovery framework;
- importing Playwright into `appE2EPaths.ts`;
- moving specs;
- changing product scenarios, platform applicability data, retries, workers, timeouts, or CI topology;
- using the shared predicate as the only proof that Playwright collection is correct;
- fixed probe paths that may already exist;
- deleting a generic pre-existing `tests/e2e/**` directory;
- weakening existing Storybook/visual/release isolation.

## Implementation readiness

- required product decisions: resolved;
- ownership: resolved;
- source of truth: resolved to `scripts/lib/appE2EPaths.ts`;
- public API: three verifier-only exports;
- proof ownership: resolved;
- unresolved blockers: none;
- verdict: **ready**.
