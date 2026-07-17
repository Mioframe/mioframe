# Testing architecture migration plan

`docs/testing/architecture.md` defines the durable target. This plan applies that already-resolved architecture to the current repository. It must not be used to redesign test ownership or impact resolution during implementation.

## Fixed target

The migration must preserve these decisions:

- proof types and execution lanes remain separate;
- every non-trivial change records `TEST IMPACT` before implementation;
- `unit-tests` run directly changed tests, owning tests for changed snapshots, and Vitest related-test selection over static imports for existing source and local test-support modules;
- unresolved snapshots, deleted/renamed unit dependencies, Vitest config/setup, global test utilities, known dynamic-import boundaries, generated aliases, and unknown unit impact use full-unit fallback;
- Storybook behavior, app E2E, and visual use separate small impact registries with shared mechanical schemas and validation;
- every Playwright spec has a source mapping or a justified standalone entry;
- changed visual baselines resolve to their owning visual specs or use full visual fallback;
- matching Playwright mappings are unioned and deduplicated;
- changed specs select themselves;
- common lane config/helpers and unknown Playwright impact select the full owning lane;
- app E2E canonical project runs all selected scenarios;
- mobile project runs only `@mobile` and `@critical` scenarios;
- mutation is an explicit narrow audit selected in `TEST IMPACT`, not inferred from paths;
- performance evidence remains task-specific until repeated work proves a stable automated lane is needed;
- no generic dependency graph, production test annotations, test DSL, or cross-lane registry.

## Migration rules

- Use focused PRs and preserve regression protection before removing or relocating tests.
- Keep production behavior unchanged unless migration exposes a real defect that receives separate resolved scope.
- Prefer deleting invalid or duplicate assertions over translating every assertion to another lane.
- Keep broad fail-closed fallback until its focused replacement is implemented and tested.
- Final `pnpm verify` remains mandatory throughout migration, even while it executes broader legacy scope.
- Remove this plan when all completion criteria are satisfied; durable rules remain in `docs/testing/architecture.md`.

## Current mismatches

### Proof ownership

- visual specs contain browser-behavior and computed token/geometry assertions;
- generic Material foundation behavior is repeated across component families;
- broad component tests reconstruct product behavior through global stubs;
- some test helpers silently recover from missing expected state.

### Impact execution

- mutation applicability is inferred from changed files and sibling tests;
- unit selection is mainly changed tests plus colocated siblings rather than static import impact;
- visual selection treats broad shared UI/foundation paths as full-lane changes;
- app E2E uses broad full-suite fallback for many known source areas;
- every selected app E2E scenario is duplicated across desktop and mobile.

These mismatches do not invalidate current CI gates until replacements are implemented and verified.

## Phase 1: establish deterministic impact infrastructure

### 1. Vitest related and snapshot selection

Implement `unit-tests` planning as:

1. include directly changed test files;
2. resolve added, changed, or deleted Vitest snapshots to their owning tests through the configured snapshot convention;
3. pass changed existing production and local test-support modules to Vitest related-test selection in run mode;
4. union and deduplicate direct, snapshot-owned, and related tests;
5. run the full unit lane for an unresolved snapshot, deleted or renamed non-test module, Vitest config/setup, global test utility, known dynamic-import boundary, generated alias, or an unrepresentable relation;
6. keep empty scope only when no unit proof is required by changed paths and `TEST IMPACT` does not name explicit tests.

Acceptance:

- a changed source, local fixture, or `testUtils` module selects statically importing tests, not only a sibling;
- a changed test always runs directly;
- a changed snapshot runs its owning test;
- unresolved snapshots and deleted/renamed dependencies cannot silently lose proof;
- fallback categories are explicit and unit-tested;
- dynamic-import and global setup changes cannot silently skip unit proof;
- no custom dependency graph is introduced.

### 2. Shared Playwright impact contracts

Create small reusable contracts used by three independent lane registries:

```ts
interface TestImpactEntry {
  readonly name: string;
  readonly sourcePrefixes: readonly string[];
  readonly specs: readonly string[];
}

interface StandaloneSpecEntry {
  readonly spec: string;
  readonly reason: string;
}
```

Registry owners:

- Storybook browser behavior registry;
- app E2E registry;
- visual registry.

Use standalone only when no truthful stable source mapping exists, such as lane-infrastructure smoke. It is not an alternative to maintaining known impact.

Entry names, arrays, specs, and reasons are non-empty. Validation rejects missing specs, duplicate mapping names, duplicate paths within one entry, duplicate standalone specs, empty reasons, invalid paths, and uncovered discovered specs. Overlapping source prefixes and a spec referenced by multiple mappings are valid; planning unions and deduplicates all matches.

Visual planning additionally resolves added, changed, or deleted baselines to their owning visual specs through the configured Playwright snapshot convention. An unresolved baseline selects the full visual lane.

Acceptance:

- a changed spec selects itself;
- a changed visual baseline selects its owning visual spec;
- a changed mapped source selects the union of registered specs;
- every discovered spec has a mapping or justified standalone entry;
- a new/moved/removed spec requires a matching mapping or standalone update;
- overlapping valid mappings do not fail or duplicate execution;
- standalone entries cannot hide known stable impact;
- unresolved baselines cannot silently skip visual proof;
- broken registry integrity fails before test execution;
- the contracts contain no product semantics or cross-lane orchestration.

### 3. Full-lane fallback rules

For each Playwright lane:

- lane config, global setup, global fixture, or shared common helper selects the whole lane;
- known helpers with explicit complete consumer lists may select only those consumers;
- unknown production impact selects the complete potentially affected lane;
- an unresolved visual baseline selects the complete visual lane;
- an empty inferred scope does not override explicit `TEST IMPACT` paths.

Acceptance:

- no known shared helper silently misses a consumer;
- unknown impact remains safe;
- broad fallback is not used for already-mapped local changes.

## Phase 2: correct lane ownership

### 4. Remove behavior from visual specs

- keep only deterministic story preparation and bounded screenshots under `tests/e2e/visual/`;
- move reusable browser behavior to `tests/e2e/storybook/`;
- move complete product scenarios to app E2E only when product composition is the owner;
- delete duplicate behavior already proved elsewhere;
- update all affected impact registries.

Acceptance:

- visual specs contain no behavior success criteria or token-table matrices;
- relocated tests use real public browser input;
- visual baselines retain meaningful regression protection.

### 5. Make action helpers strict

- split required action/assertion helpers from optional cleanup helpers;
- remove silent returns, repeated fallback delivery, and fixed-delay recovery;
- make missing preconditions and outcomes fail with clear diagnostics;
- register shared helper consumers or use full owning-lane fallback.

Acceptance:

- required actions cannot become silent no-ops;
- cleanup is never used as behavior evidence;
- product defects are exposed rather than masked.

### 6. Align mutation execution

- remove default mutation applicability based on path or sibling-test existence;
- retain explicit `pnpm verify --only mutation --files ...`;
- schedule mutation only when `TEST IMPACT` and the mutation skill activation both apply;
- remove the unconditional ordinary-development mutation step after default planning no longer relies on it;
- preserve any named high-risk merge policy only with an explicit narrow scope.

Acceptance:

- UI, refactor, documentation, and ordinary low-risk changes do not schedule mutation;
- explicit narrow mutation remains fail-closed;
- final development verification does not spend mutation time on unrelated changes.

## Phase 3: proportional project and consumer selection

### 7. App E2E mobile tags

- keep one canonical project for all selected scenarios;
- tag real mobile-risk scenarios `@mobile`;
- tag only the small essential cross-platform smoke set `@critical`;
- configure the mobile project with project-level filtering for those tags;
- keep reusable responsive behavior in Storybook with explicit viewports.

Acceptance:

- platform-independent scenarios run once;
- mobile-specific and critical smoke coverage remains direct;
- every mobile duplication has a visible tag and reason.

### 8. Replace broad known-path fallback

As real changes occur, add stable source-to-spec mappings for known shared UI, feature, entity, page, service-client, foundation, and helper ownership.

Keep full app E2E for bootstrap, cross-cutting worker/service protocols, E2E infrastructure, and genuinely unknown impact.

Acceptance:

- mapped local source changes run representative owning scenarios;
- unknown impact remains fail-closed;
- registries remain small mechanical maps rather than a second architecture model.

### 9. Consolidate foundation proof

- move complete generic focus, state-layer, ripple, elevation, motion, and transient-state proof to foundation owners;
- retain family-specific routing, anatomy, deviations, and unique outcomes;
- update visual and Storybook impact mappings for foundation consumers.

Acceptance:

- foundation defects still fail focused proof;
- component families no longer duplicate identical generic matrices;
- canonical Material evidence remains complete.

### 10. Decompose pseudo-integration unit suites

For each touched broad mocked suite:

- move deterministic decisions to `unit-testing` at the real owner;
- retain narrow Vue public wiring in component contract tests;
- retain complete product outcome in app E2E when needed;
- delete broad stubs and duplicate assertions.

Acceptance:

- failures identify a contract;
- global stubs decrease;
- no user scenario loses meaningful protection.

## Completion criteria

Migration is complete when:

- agents consistently produce `TEST IMPACT` before non-trivial edits;
- unit selection uses direct tests, snapshot ownership, and Vitest static-import related selection with tested snapshot/deletion/dynamic/global fallbacks;
- all Playwright lanes use validated small mappings, justified standalone entries, union/deduplication, complete spec coverage, visual baseline ownership, and safe full-lane fallback;
- visual specs prove appearance only;
- reusable browser behavior and product scenarios have distinct ownership;
- mobile execution is tag-driven and proportional;
- mutation is explicit and narrow;
- foundation behavior is not repeated by every consumer;
- broad mocked pseudo-integration suites no longer substitute for faithful proof;
- focused development and full release verification remain green and diagnostically useful.
