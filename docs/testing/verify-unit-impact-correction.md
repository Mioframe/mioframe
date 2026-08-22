# Verify unit-impact correction

Status: **implemented and architect-reviewed**.

This document narrows the unit-impact contract in `verify-target-architecture.md`. It separates real Vitest test discovery from dependency-input eligibility and defines the external ownership mechanisms required by the current repository. It does not introduce a second dependency graph or a generic repository dependency system.

`docs/testing/verify-app-e2e-discovery-correction.md` separately owns the physical application Playwright collection contract used by root application inventory proof.

## Problem

Unit impact has two different concerns that must not be conflated:

- **Vitest test discovery** — which repository files are direct Vitest test modules;
- **Vitest dependency inputs** — which changed repository files discovered tests may consume through imports or external repository observation.

Ordinary import ownership is delegated to Vitest. Some current tests also observe repository inputs outside the import graph through exact reads, runtime config discovery, bounded scans, or existence assertions; those relations require explicit local ownership.

## Decision

### 1. Direct Vitest discovery is exact

The direct Vitest test population comes from `vitest.config.ts`:

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

`isTestShapedPath()` mirrors this matrix literally:

- `src/**` / `config/**` → `.test.ts` only;
- `scripts/**` → `.test.ts` or `.test.mjs`;
- `tests/e2e/**` → `.test.mjs` only;
- exact root `eslint.config.test.ts` and `playwright.<name>.test.ts` remain supported.

In particular, `src/**/*.test.mjs` and `config/**/*.test.mjs` are not direct Vitest tests.

### 2. Ordinary dependency inputs are repository-wide

For an added/modified current-tree module/style/support input of a supported shape, pass the source itself to:

```text
vitest related <inputs...>
```

regardless of whether it lives under `src/`, `config/`, `scripts/`, `tests/e2e/`, or repository root.

A path may therefore be invalid as a direct test shape while still being a truthful ordinary dependency input. For example, `src/example.test.mjs` is not a direct Vitest test but remains a plausible `.mjs` source/support input for `vitest related`.

A valid ordinary input with zero Vitest owners may produce zero related tests. Do not force full unit merely because the import graph has no unit owner.

Known Playwright-only proof and documentation are not made ordinary unit inputs by this rule.

### 3. Vitest owns the import graph

The verifier must not calculate, persist, or reproduce the Vite/Vitest module graph.

Do not duplicate an owner in external metadata when a real import relation lets `vitest related <source>` select it.

Examples:

- `postcss.config.js → config/postcss.config.test.ts` is ordinary import ownership;
- `vite.config.ts → scripts/release/viteBuildDate.test.mjs` is ordinary import ownership and is not duplicated as an external mapping.

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
- forbidden legacy `src/shared/lib/md/tokens.css` existence contract → Material token proof;
- fixed shared/style sources read directly by their owning tests.

Do not manufacture a mapping from temporary test fixtures or from an already import-reachable relation.

### 5. Bounded repository scans are external set ownership

A Vitest test that deterministically scans a repository population owns that set even without an import edge.

Represent each real scan with the smallest local predicate matching the scanner's actual population. Do not map every scanned file individually, run full unit for a broad root, generate a dependency graph, or reuse a broader neighboring category for convenience.

Each scan predicate needs a representative positive inside its real population and a nearby negative outside it.

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
   - its real Storybook behavior spec inventories;
9. `scripts/lib/visualRisk.test.ts`
   - its real colocated visual inventory.

### 6. Application-E2E inventory is physically root-only

The root application scan predicates are tied to the real Playwright config contract in `docs/testing/verify-app-e2e-discovery-correction.md`:

```text
playwright.config.ts
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

The physical config is root-only. The application-E2E correction document currently owns one reopened planner/proof-safety alignment issue; that does not reopen unit-impact architecture itself.

The broader `isPlaywrightOnlyProofPath` concern remains separate: Playwright-owned `*.spec.ts` paths must not become ordinary Vitest dependency inputs merely because they have a `.ts` suffix.

### 7. External-ownership audit is semantic

Audit the current Vitest-owned population for repository observation outside the import graph, including:

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

| Mechanism                              | Representative case                       | Planner ownership                                                 | Required evidence                            |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| direct changed Vitest test             | `scripts/lib/unitRisk.test.ts`            | select test itself                                                | focused unit invocation                      |
| direct discovery negative              | `src/example.test.mjs`                    | not direct test                                                   | owner-validation negative                    |
| unsupported test-shaped ordinary input | `src/example.test.mjs`                    | pass source to `vitest related`                                   | planner overcorrection guard                 |
| ordinary import dependency             | `postcss.config.js`                       | pass source to `vitest related`                                   | real related owner selected                  |
| cross-root ordinary import             | `vite.config.ts → viteBuildDate.test.mjs` | source only                                                       | real related owner selected                  |
| `tests/e2e/**` ordinary helper         | managed release fixture helper            | pass helper                                                       | real related owner selected                  |
| exact repository read                  | workflow YAML                             | exact owners                                                      | focused owner invocation                     |
| exact delete/rename                    | workflow / `PRIVACY.md` / `.gitignore`    | retain deterministic old/new owner                                | status-aware planner proof                   |
| runtime discovery                      | `eslint.config.mjs`                       | exact owner                                                       | planner-added owner executes                 |
| exact absence                          | forbidden legacy token path               | exact owner                                                       | owner executes                               |
| bounded source scan                    | source import-boundary tests              | scan owner                                                        | representative scanned change                |
| bounded Material token scan            | component `tokens.css`                    | token scan owner                                                  | representative token change                  |
| root app inventory                     | `tests/e2e/appSmoke.spec.ts`              | lane + registry/applicability inventory owners; never spec itself | real app collector + focused unit invocation |
| outside app inventory                  | nested arbitrary app spec candidate       | no root-app inventory owner; never ordinary Vitest input          | root-only collector/planner negative         |
| unit-global infrastructure             | `vitest.config.ts` etc.                   | full unit                                                         | planner proof                                |

## Proof result

Fresh test-author proof for the final direct-test discovery mismatch established RED for unsupported `src/**/*.test.mjs` and `config/**/*.test.mjs` external-owner paths. The implementation then made the exact discovery matrix green while preserving ordinary dependency-input pass-through. Focused unit proof and type-check passed.

Delegated ownership continues to require representative real resolver/tool proof rather than pure planner assertions when practical.

## Forbidden

- second module/dependency graph;
- generic cross-lane ownership framework;
- prefix-limited ordinary dependency inputs;
- redundant external metadata for import-reachable owners;
- arbitrary full-unit fallback when deterministic exact ownership exists;
- broad scan predicates that exceed the owning scanner's population;
- treating arbitrary Playwright `*.spec.ts` as ordinary Vitest input;
- treating `src/**/*.test.mjs` / `config/**/*.test.mjs` as direct Vitest tests contrary to `vitest.config.ts`.

## Closure

Unit-impact architecture and the direct Vitest discovery correction are closed. Remaining verifier-modernization findings, if any, are tracked separately in `scripts/lib/REVIEW.md` and must not be used to reopen this unit contract without new repository evidence.
