# Verify application-E2E discovery correction

Status: **architecture reopened for one final planner/proof-safety alignment correction**.

This document is the durable architecture contract for application-E2E physical discovery and changed-path selection. `docs/testing/architecture.md` remains canonical testing policy; `docs/testing/verify-target-architecture.md` owns the wider verifier architecture.

## Goal

Keep one truthful application-E2E population across physical Playwright collection, changed-path planning, scenario/applicability inventories, and their unit ownership:

```text
application E2E
→ direct tests/e2e/*.spec.ts only

Storybook behavior
→ tests/e2e/storybook/**/*.spec.ts
→ src/**/*.browser.spec.ts

visual
→ tests/e2e/visual/**/*.spec.ts
→ src/**/*.visual.spec.ts

release
→ tests/e2e/release/**/*.spec.ts
```

A file must not be selected as application E2E when the application Playwright config cannot collect it, and proof infrastructure must never overwrite or delete unrelated repository content.

## Architecture decision

### Physical source of truth

The physical source of truth is the resolved `playwright.config.ts`:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

The single `*` after `tests/e2e/` is intentional: application specs are direct children only.

`testMatch` is the single physical lane boundary. Application project `testIgnore` is reserved only for desktop/mobile applicability returned by `getProjectIgnoredSpecs(...)`; Storybook/visual/release subtree ignores are not a second lane-boundary mechanism.

### Planner classification must use the same corpus

`scripts/lib/e2eRisk.ts` must use the same root-only definition for a changed application spec:

```text
tests/e2e/<name>.spec.ts
→ application spec

tests/e2e/<subdir>/<name>.spec.ts
→ not an application spec unless that path belongs to another declared lane
```

An arbitrary nested path such as:

```text
tests/e2e/other/example.spec.ts
```

is not an application spec and must not become application support merely because it is a TypeScript `.spec.ts` path.

This does **not** make every nested `tests/e2e/**` path irrelevant. A real non-spec application helper/support file such as a nested `.ts` helper can still be application-E2E support when it is outside the reserved Storybook/visual/release owners. The correction is specifically about keeping spec classification aligned with physical collection.

Reserved ownership remains unchanged:

- `tests/e2e/storybook/**` → Storybook behavior;
- `tests/e2e/visual/**` → visual;
- `tests/e2e/release/**` → release.

Do not introduce a generic Playwright discovery registry or glob framework. A small explicit root-app path predicate is sufficient.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `playwright.config.ts` | physical application-E2E collection |
| `scripts/lib/e2eRisk.ts` | source/spec → root application scenario ownership |
| `scripts/lib/e2eProjectApplicability.ts` | root application spec → desktop/mobile applicability |
| `playwright.lanes.test.ts` | cross-lane physical inventory/disjointness and real collector proof |
| `scripts/lib/unitRisk.ts` | unit ownership of tests that scan the real Playwright inventories |

Product/FSD ownership is unchanged.

## Accepted physical implementation

`playwright.config.ts` already correctly:

- keeps `testDir: './tests/e2e'`;
- sets top-level `testMatch: '**/tests/e2e/*.spec.ts'`;
- removes the former shared Storybook/visual/release subtree `testIgnore` layer;
- keeps project `testIgnore` exactly as `getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME)` / `getProjectIgnoredSpecs(MOBILE_PROJECT_NAME)`.

`e2eProjectApplicability.ts`, scenario-registry filesystem discovery, and unit bounded-scan ownership are already root-only. The remaining behavioral correction is to make `e2eRisk.ts` direct changed-spec classification match that same corpus.

## Collector proof safety

The real collector proof remains required because planner predicates alone cannot prove delegated Playwright discovery.

Probe files are test-owned mutable state and must be collision-safe:

- never overwrite a pre-existing repository file;
- never reserve a generally valid future repository path such as `tests/e2e/example.test.mjs`;
- never recursively delete a fixed directory that may contain unrelated repository files;
- use unique/collision-resistant proof-owned paths and exclusive creation, or an equivalent mechanism that fails instead of overwriting;
- record exactly which files/directories the test created;
- remove only those created paths in guaranteed cleanup;
- keep collection server/browser-free through the existing external-base-URL seam.

The proof must still exercise both distinct exclusions:

1. one nested `*.spec.ts` path that would be collected by recursive/default Playwright discovery but must be excluded by the app config;
2. one direct-root default Playwright `*.test.*` shape that must also be excluded by the app config.

A filtered real-collector invocation must additionally confirm that supplying the nested path as a CLI file filter does not make it part of the configured application lane. The real `testMatch` remains authoritative.

## Acceptance matrix

| Path shape | Application collection/selection | Owner |
| --- | --- | --- |
| `tests/e2e/appSmoke.spec.ts` | collect + application-select | application E2E |
| `tests/e2e/<another-root>.spec.ts` | collect + application-select; must enter registry/applicability ownership | application E2E |
| `tests/e2e/other/example.spec.ts` | no collect; no application spec/support selection | none until explicitly assigned |
| `tests/e2e/other/helper.ts` | not a spec; may remain conservative application support when outside reserved lanes | application support when applicable |
| `tests/e2e/example.test.ts` | no application collection/selection | not application E2E |
| `tests/e2e/example.test.mjs` | no application collection/selection | Vitest only when its Vitest contract applies |
| `tests/e2e/storybook/example.spec.ts` | no application selection | Storybook behavior |
| `tests/e2e/visual/example.spec.ts` | no application selection | visual |
| `tests/e2e/release/example.spec.ts` | no application selection | release |
| `src/**/Example.browser.spec.ts` | no application selection | Storybook behavior |
| `src/**/Example.visual.spec.ts` | no application selection | visual |

## TEST IMPACT

Automated planning/proof behavior changes materially. Follow `test-first` with a fresh test-author context.

### Contract 1 — root-only planner classification

- Primary proof owner: `scripts/lib/e2eRisk.test.ts`.
- Oracle: this document + real `playwright.config.ts`.
- Must reject: `tests/e2e/other/example.spec.ts` being recognized as an app spec, app support, or focused app spec.
- RED: required; current `isAppE2ESpecPath()` accepts the nested path.
- Preserve: real root app spec focused selection; nested ordinary helper support behavior; reserved Storybook/visual/release exclusions.

### Contract 2 — delegated collector alignment

- Primary proof owner: `playwright.lanes.test.ts`.
- Oracle: real `playwright.config.ts` and this document.
- Must reject: a nested spec becoming collected merely because it is supplied as a CLI file filter.
- Real Playwright collection-only proof is required; do not substitute a copied glob predicate.
- Browser/server launch is not required.

### Contract 3 — probe isolation

- Primary proof owner: `playwright.lanes.test.ts` test setup/cleanup itself.
- Oracle: repository test-authoring rules for controlled, isolated inputs.
- Must reject: overwriting a pre-existing valid test/support path or recursively deleting a pre-existing directory.
- A separate RED is not required solely for the proof-harness safety rewrite; review the creation/cleanup mechanism directly and keep the real collector proof green.

## Required verification

Use focused feedback only:

- focused unit proof for `scripts/lib/e2eRisk.ts` / `scripts/lib/e2eRisk.test.ts`;
- focused `playwright.lanes.test.ts` proof including the real collector/filter case;
- existing scenario-registry and project-applicability proof when affected;
- type-check for touched TypeScript when useful.

Do not run a browser E2E suite merely to prove file discovery. Exact-head CI remains architect-owned.

## Non-goals / forbidden architecture

- no nested application-E2E convention;
- no recursive application scenario/applicability registries;
- no movement of current application specs;
- no generic Playwright discovery registry/glob abstraction;
- no Storybook/visual/release config redesign;
- no retries, workers, timeouts, CI-topology, or product behavior changes;
- no unit/release/mutation architecture change.

## Current review state

The physical `playwright.config.ts` correction remains accepted. Final PR-level review reopened the broader application-E2E correction because `e2eRisk.ts` still classified nested specs more broadly than the physical lane and the real-collector proof used collision-unsafe fixed probe paths.

The correction is **architecture ready** once implemented against the contracts above.