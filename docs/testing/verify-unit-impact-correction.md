# Verify unit-impact correction

Status: **accepted architecture; application-E2E inventory alignment closed; one local Vitest test-shape implementation mismatch remains under review**.

This document narrows the unit-impact contract in `verify-target-architecture.md`. It separates real Vitest test discovery from dependency-input eligibility and defines the external ownership mechanisms required by current repository tests. It does not introduce a second dependency graph or a generic repository dependency system.

`docs/testing/verify-app-e2e-discovery-correction.md` owns the physical application Playwright collection contract that makes the root application inventory below truthful.

## Problem

Unit impact has two different concerns that must not be conflated:

- **Vitest test discovery** — which repository files are direct Vitest test modules;
- **Vitest dependency inputs** — which changed repository files discovered tests may consume through imports or external repository observation.

Ordinary import ownership is delegated to Vitest. Some current tests also observe repository inputs outside the import graph through exact reads, runtime config discovery, bounded scans, or existence assertions; those relations require explicit local ownership.

## Decision

### 1. Direct Vitest discovery is exact

The current direct Vitest test population comes from `vitest.config.ts`:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

Playwright `*.spec.ts` proof is never a direct Vitest test merely because it is TypeScript.

Implementation rule: `isTestShapedPath()` must mirror this matrix literally. In particular, `src/**/*.test.mjs` and `config/**/*.test.mjs` are not direct Vitest tests. This exactness is currently an open local implementation finding under `scripts/lib/REVIEW.md`; it does not change the architecture.

### 2. Ordinary dependency inputs are repository-wide

For an added/modified current-tree module/style/support input of a supported shape, pass the source itself to:

```text
vitest related <inputs...>
```

regardless of whether it lives under `src/`, `config/`, `scripts/`, `tests/e2e/`, or repository root.

A valid ordinary input with zero Vitest owners may produce zero related tests. Do not force full unit merely because the import graph has no unit owner.

Known Playwright-only proof and documentation are not made ordinary unit inputs by this rule.

### 3. Vitest owns the import graph

The verifier must not calculate, persist, or reproduce the Vite/Vitest module graph.

Do not duplicate an owner in external metadata when a real import relation lets `vitest related <source>` select it.

Examples:

- `postcss.config.js → config/postcss.config.test.ts` is ordinary import ownership;
- `vite.config.ts → scripts/release/viteBuildDate.test.mjs` is ordinary import ownership and must not be duplicated as an external mapping.

### 4. Exact external ownership is additive and status-aware

Use exact external ownership only when a current Vitest test consumes a fixed repository input outside the import graph, such as:

- direct repository source/file read;
- stable runtime/tool config discovery;
- exact existence/absence assertion.

Exact ownership adds the owning test while preserving any ordinary import relation for the same source.

It is a repository path contract, not a current-file-existence contract:

- added/modified source → exact owner;
- deleted source → surviving exact owner when the fixed-path relation remains deterministic;
- rename → evaluate both old and new paths;
- current source existence is not required merely to recognize deterministic ownership.

If a historical relation cannot be represented safely, use the existing full-unit fallback rather than skip.

Confirmed examples include:

- `PRIVACY.md → DataStoragePrivacyPane.test.ts`;
- workflow YAML → workflow/source-reading tests;
- `.gitignore → scripts/agentEnvironment.test.mjs`;
- `eslint.config.mjs → eslint.config.test.ts` through ESLint runtime discovery;
- `vite.config.ts → config/viteConfigFixtureImport.test.ts` direct read;
- the forbidden legacy `src/shared/lib/md/tokens.css` existence contract → Material token proof;
- fixed shared/style sources read directly by their owning tests.

Do not manufacture a mapping from temporary test fixtures or from an already import-reachable relation.

### 5. Bounded repository scans are external set ownership

A Vitest test that deterministically scans a repository population owns that set even without an import edge.

Represent each real scan with the smallest local predicate matching the scanner's actual population. Do not:

- map every scanned file individually;
- run full unit for every file under a broad root;
- create a generated dependency graph;
- reuse a broader neighboring category merely for convenience.

Every scan predicate needs:

- a representative positive inside the actual scanned population;
- a nearby negative outside it.

Confirmed scan owners:

1. `src/readRecoveryImportBoundary.test.ts`
   - production `src/**/*.{ts,vue}`, excluding test files;
2. `src/features/fileSystemAccessImportBoundary.test.ts`
   - production `src/features/**/*.{ts,vue}`, excluding test files;
3. `src/shared/ui/material/rendererBoundary.test.ts`
   - `src/**/*.{css,vue,ts,mts,tsx}` outside `src/shared/ui/material/**`;
4. `src/shared/ui/material/foundation/tokens.test.ts`
   - existing `src/shared/ui/material/components/*/tokens.css`;
5. `playwright.lanes.test.ts`
   - direct root application `tests/e2e/*.spec.ts`;
   - recursive `tests/e2e/storybook/**/*.spec.ts`;
   - recursive `tests/e2e/visual/**/*.spec.ts`;
   - recursive `tests/e2e/release/**/*.spec.ts`;
   - recursive `src/**/*.browser.spec.ts`;
   - recursive `src/**/*.visual.spec.ts`;
6. `scripts/lib/e2eRisk.test.ts`
   - direct root application `tests/e2e/*.spec.ts` scenario inventory;
7. `scripts/lib/e2eProjectApplicability.test.ts`
   - direct root application `tests/e2e/*.spec.ts` applicability inventory;
8. `scripts/lib/storybookBehaviorRisk.test.ts`
   - its actual Storybook behavior spec inventories;
9. `scripts/lib/visualRisk.test.ts`
   - its actual colocated visual inventory.

### 6. Application-E2E inventory is physically root-only

The root application scan predicates above are not merely local conventions anymore.

`docs/testing/verify-app-e2e-discovery-correction.md` establishes the real Playwright config contract:

```text
playwright.config.ts
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

Real Playwright `--list` proof confirmed:

- root `tests/e2e/appSmoke.spec.ts` is app-collected;
- temporary `tests/e2e/other/example.spec.ts` is not app-collected;
- temporary root `tests/e2e/example.test.mjs` is not app-collected;
- Storybook/visual/release nested specs are not app-collected.

Therefore `tests/e2e/other/example.spec.ts` is a valid adjacent-negative case for the root application bounded scans because it is outside both the scanners' enumerated population **and** the physical application lane.

The broader `isPlaywrightOnlyProofPath` concern remains separate: Playwright-owned `*.spec.ts` paths must not become ordinary Vitest dependency inputs merely because they have a `.ts` suffix.

### 7. External-ownership audit is semantic

Audit the complete current Vitest-owned population for repository observation outside the import graph, including:

- `node:fs` / `node:fs/promises` reads and existence/stat/access checks;
- deterministic `readdir*` scans;
- child/tool/runtime config discovery;
- equivalent external repository lookups.

Classify each candidate as exactly one of:

- ordinary import ownership;
- exact external ownership;
- bounded scan ownership;
- temporary/test-owned data;
- unit-global infrastructure;
- unrelated/non-unit.

Search expressions are discovery aids, not the audit boundary.

The post-`develop` synchronization audit found no additional external ownership mechanism or relation beyond the recorded set.

### 8. Full-unit fallback remains status/infrastructure safety

Keep full unit for actual Vitest-global inputs and unsafe historical relations, including:

- `vitest.config.ts`;
- `src/setupVitest.ts`;
- global Vitest config imports;
- `pnpm-lock.yaml`;
- runtime-relevant/unknown `package.json`;
- deleted direct tests or ordinary dependencies whose historical ownership is unsafe;
- unsafe moves/renames.

Do not turn arbitrary root config files or broad scanned directories into full-unit triggers merely because an earlier planner could not represent them.

## Acceptance matrix

| Mechanism | Representative case | Planner ownership | Required evidence |
| --- | --- | --- | --- |
| direct changed Vitest test | `scripts/lib/unitRisk.test.ts` | select test itself | focused unit invocation |
| ordinary import dependency | `postcss.config.js` | pass source to `vitest related` | real related owner selected |
| cross-root ordinary import | `vite.config.ts → viteBuildDate.test.mjs` | source only | real related owner selected |
| `tests/e2e/**` ordinary helper | managed release fixture helper | pass helper | real related owner selected |
| exact repository read | workflow YAML | exact owners | focused owner invocation |
| exact delete/rename | workflow / `PRIVACY.md` / `.gitignore` | retain deterministic old/new owner | status-aware planner proof |
| runtime discovery | `eslint.config.mjs` | exact owner | planner-added owner executes |
| exact absence | forbidden legacy token path | exact owner | owner executes |
| bounded source scan | source import-boundary tests | scan owner | representative scanned change |
| bounded Material token scan | component `tokens.css` | token scan owner | representative token change |
| root app inventory | `tests/e2e/appSmoke.spec.ts` | lane + registry/applicability inventory owners; never spec itself | real app collector + focused unit invocation |
| outside app inventory | `tests/e2e/other/example.spec.ts` | no root-app inventory owner; never ordinary Vitest input | real collector excludes + planner negative |
| unit-global infrastructure | `vitest.config.ts` etc. | full unit | planner proof |

## Required proof discipline

For materially changed unit-impact proof, use a fresh test-author context before implementation. Pure planner assertions are insufficient when ownership is delegated to a real resolver such as Vitest or Playwright; representative real resolver/tool probes are required.

Accepted delegated proof includes real `vitest related` cases for ordinary imports and the real Playwright collector proof for application physical discovery.

## Forbidden

- second module/dependency graph;
- generic cross-lane ownership framework;
- prefix-limited ordinary dependency inputs;
- redundant external metadata for import-reachable owners;
- arbitrary full-unit fallback when deterministic exact ownership exists;
- broad scan predicates that exceed the owning scanner's population;
- treating arbitrary Playwright `*.spec.ts` as ordinary Vitest input;
- treating `src/**/*.test.mjs` / `config/**/*.test.mjs` as direct Vitest tests contrary to `vitest.config.ts`.

## Current implementation status

Implemented and accepted:

- repository-wide ordinary input delegation;
- additive/status-aware exact ownership;
- bounded scan ownership;
- runtime/existence ownership;
- real Playwright root-only application discovery alignment.

Still open under `scripts/lib/REVIEW.md`:

- make direct `isTestShapedPath()` recognition literally match the Vitest include matrix.

No architecture redesign is required for that remaining local correction.