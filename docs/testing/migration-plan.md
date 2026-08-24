# Testing architecture migration plan

`docs/testing/architecture.md` defines the durable target. This document records the current executable verifier/test state, migration constraints, and capability transitions to that target. The concrete implementation pass order for this redesign is defined by `docs/testing/verify-redesign-implementation-preflight.md`.

It is intentionally operational rather than historical. Older detailed migration records remain available in Git history. `docs/testing/verify-modernization.md` and `docs/testing/verify-e2e-planner-precision.md` describe the legacy verifier design/implementation that exists before this redesign; they are not the target architecture after `docs/testing/architecture.md` was updated.

## Migration constraints

- Every intermediate repository state must remain safe: never delete a legacy discovery/mapping path before its replacement executes and is validated on the same state.
- Preserve or strengthen proof before narrowing execution.
- Keep broad fail-closed fallback until deterministic replacement ownership is implemented and tested.
- Do not make `verify` depend on `TEST IMPACT`, agent prose, or uncommitted reports.
- Do not redesign ownership inside implementation. `docs/testing/architecture.md` is the decision source.
- Do not move or rename a spec before the owning runner/configuration can discover the target suffix/location.
- Add/modify/remove/move behavior must remain deterministic and must never silently skip relevant proof.
- Structural invalidity must fail verification; uncertainty widens coverage.
- Do not maintain old and new ownership metadata permanently. Compatibility is temporary and must be removed after migration proof.
- Preserve existing command locks, timeouts, status/resume behavior, CI environment handling, and other verifier orchestration unless a target contract explicitly requires changing them.

## Current executable transitional state

The current repository already provides substantial verification infrastructure that should be reused rather than rewritten.

### Changed-path and orchestration foundation

- `scripts/lib/changedPaths.ts` preserves added, modified, removed, and both identities of renamed/moved paths.
- `scripts/verify.ts` already owns command planning/execution, command locks, Playwright container bounds, result/log handling, and fail-closed planner states.
- `pnpm verify`, `--files`, `--full`, status/resume, and fix support already exist.
- Public `--only` now exposes exactly the canonical verification types: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`. Low-level leaf labels remain private verifier identifiers for execution, logs, weights, locks, and diagnostics.
- `pnpm verify:release` still aliases `pnpm verify --full` as transitional compatibility; final alias removal remains a later pass.

### Static

- format, Oxlint, ESLint, type-check, instruction compatibility, Storybook build, build/release configuration checks, and related deterministic operations remain separate internal labels/checks composed under the public `static` type.
- removed files are already projected away from direct formatter/linter child-command inputs where required.
- Storybook buildability is a static proof; GitHub duplicate-build avoidance is an internal execution optimization rather than a public fallback flag.

### Unit

- Vitest is the unit runner and is exposed publicly as the `unit` verification type.
- current automatic unit selection does not yet fully implement the target native related/affected model for all source/test-support changes.
- current `*.test.ts` and supported script-test naming remains executable.

### Storybook behavior

- Storybook stories are colocated under `src/**/*.stories.*`.
- isolated UI browser proof currently uses the legacy `*.browser.spec.ts` suffix while the public verification type is already `behavior`.
- mixed discovery currently executes owner-local `src/**/*.browser.spec.ts` plus justified central `tests/e2e/storybook/**/*.spec.ts` cross-owner/infrastructure proof.
- current owner-local behavior selection is filesystem-derived for migrated owners.
- existing central Storybook behavior mappings remain where current cross-owner/infrastructure proof still uses them.

Target difference: ordinary behavior proof becomes `*.behavior.spec.ts`. Central product-like dumping grounds are not part of the target; any surviving cross-owner Storybook infrastructure proof must remain explicitly justified and be classified as behavior, not E2E merely because Playwright runs it.

### Visual

- `*.visual.spec.ts` is already the target suffix and `visual` is the public verification type.
- mixed discovery currently executes owner-local `src/**/*.visual.spec.ts` for migrated owners plus legacy central `tests/e2e/visual/**/*.spec.ts` for remaining owners.
- owner-local baseline resolution is already filesystem-derived for migrated owners.
- broad visual fallback remains for unresolved central ownership and visual infrastructure.

Target difference: all ordinary visual owner proof eventually becomes owner-local; the global unrelated visual directory is removed after all surviving proof has truthful local ownership.

### Browser integration

- `browser-integration` is now a public verification type and Pass A classified the split release/runtime leaves by this ownership.
- ordinary owner-local browser/runtime proof has not yet migrated to the target `*.browser-integration.spec.ts` suffix/location; current release/runtime infrastructure remains transitional and its release-only leaves are still composed by literal full mode rather than a new affected release planner.

Target difference: isolated browser/runtime contracts move to `*.browser-integration.spec.ts` next to the concrete runtime owner and participate in ordinary type-local affected planning.

### Application E2E

- application E2E specs currently live mainly as root `tests/e2e/*.spec.ts` files while `e2e` is already the public verification type.
- `scripts/lib/e2eRisk.ts` owns the manual `E2E_SCENARIO_SCOPES` source-prefix -> spec registry.
- unknown relevant application source and broad E2E infrastructure already fail closed to full application E2E.
- `scripts/lib/e2eProjectApplicability.ts` owns persistent `desktop | mobile | both` project applicability for current root application specs.

Target difference:

- E2E specs use `*.e2e.spec.ts`;
- primary ownership is structural under `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/`;
- additional owners are exceptional validated Playwright-native metadata;
- changed production source resolves owners through a `dependency-cruiser` reverse graph;
- `E2E_SCENARIO_SCOPES` and equivalent source-to-spec mapping logic are removed after the replacement is proven.

### Mutation

- Stryker and verifier-managed mutation execution already exist under the public `mutation` verification type.
- literal `pnpm verify --full` now executes the complete inventory currently configured by `stryker.config.mjs` without an affected `-m` override.
- focused/default mutation still uses the existing location/adjacency-derived affected scope; persistent explicit target ownership is not yet the final model.

Target difference: mutation uses one validated explicit project-owned target inventory; default runs affected registered targets and `--full` runs every registered target.

### Performance

- `performance` is a valid public verification type but currently has no persistent automated target inventory, so a focused performance selection is valid and empty.
- task-specific measurement exists as implementation evidence.

Target difference: durable automated performance/stress proof uses `*.performance.spec.ts`, measurable budgets, local ownership where possible, and E2E-like primary/additional ownership only for genuinely cross-system contracts.

## Public-contract mismatch during migration

Until implementation completes, distinguish **current executable compatibility** from the **durable target** where later ownership passes still differ:

| Concern | Current executable state | Target |
| --- | --- | --- |
| `--only` | exactly `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e` | same canonical public types |
| behavior suffix | `*.browser.spec.ts` | `*.behavior.spec.ts` |
| visual suffix | `*.visual.spec.ts` | `*.visual.spec.ts` |
| browser integration | public type exists; release/runtime leaves remain transitional and ordinary owner-local target suffix is not yet migrated | `*.browser-integration.spec.ts` next to runtime owner |
| E2E suffix/location | root/legacy `tests/e2e/*.spec.ts` | `tests/e2e/{pages,widgets}/<Owner>/*.e2e.spec.ts` |
| E2E impact | manual `E2E_SCENARIO_SCOPES` | reverse dependency graph -> product owner |
| unit impact | current planner behavior | Vitest native related/affected + safe fallback |
| release | private release-oriented leaf labels and `verify:release` alias remain transitional | no public release type; checks classified by proof type and `pnpm verify --full` is canonical |
| mutation in full | complete current Stryker-configured inventory | complete validated explicit mutation target inventory |
| `--full` | literal complete current inventories with no narrowing; mutation uses current Stryker inventory and persistent performance inventory is currently empty | literal all types/all target specs/all registered mutation and performance targets |

Agents implementing the redesign must not treat remaining transitional suffixes, mappings, or target ownership gaps as durable architecture.

## Migration capability phases

The phases below describe capability transitions and compatibility dependencies; they are not the concrete coding sequence for this redesign. **Pass A–F in `docs/testing/verify-redesign-implementation-preflight.md` is the authoritative implementation order and pass-boundary contract.** In particular, Pass A establishes target discovery and splits mixed release proof before Pass B changes the public CLI, even though public CLI and release reclassification are described in separate capability phases below.

### Phase 0 — architecture and rules

Status on `architecture/verify-redesign`: **Pass A and Pass B are architect-accepted. The current implementation boundary is Pass C.**

Required:

- canonical `docs/testing/architecture.md` expresses the accepted target;
- this migration plan distinguishes current executable state from target;
- verification-facing skills and repository rules use verification types rather than durable low-level labels;
- older verifier design documents are treated as legacy implementation records, not competing target architecture.

No additional verifier runtime architecture change is required in this phase.

### Phase 1 — type-level CLI and classification shell

Status: **complete and architect-accepted.**

Introduce the public type contract without rewriting existing runners.

Required:

- `--only` accepts only target verification types;
- type -> existing internal check composition is explicit and local to verifier planning;
- low-level labels are internal implementation details;
- `--full` rejects narrowing options and is defined as literal all currently executable types/inventories;
- default planning continues to use current safe resolvers while later phases replace their ownership models;
- diagnostics explain selected type, focused/full reason, and internal checks that execute.

Compatibility:

- internal labels remain valid private implementation identifiers for logs, weights, locks, timeouts, command entries, and diagnostics;
- removed public low-level label parsing must not be restored;
- current `verify:release`, legacy suffixes, and ownership mappings remain only until their later pass consumers are migrated.

### Phase 2 — spec taxonomy and local owner migration

Make independent test types machine-classifiable by suffix and placement.

Required:

- behavior discovery supports `*.behavior.spec.ts` before existing `*.browser.spec.ts` files are renamed;
- visual keeps `*.visual.spec.ts` and completes owner-local migration for surviving ordinary visual proof;
- browser-integration discovery/configuration supports `*.browser-integration.spec.ts` next to runtime owners;
- persistent performance discovery supports `*.performance.spec.ts` only where a durable budget exists;
- application/runtime TypeScript and Vitest scopes exclude non-unit Playwright/performance spec suffixes correctly;
- legacy behavior/visual locations remain executable until each surviving spec is migrated or deliberately retained as justified infrastructure proof.

Remove old suffix/location compatibility only after repository-wide discovery and ownership validation prove no required consumer remains.

### Phase 3 — E2E structural ownership and reverse graph

Replace manual E2E source mappings without reducing protection.

Required sequence:

1. add target E2E discovery for `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` and `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts` while legacy root specs still run;
2. implement filesystem primary-owner parsing and validation;
3. implement validated exceptional additional-owner metadata;
4. add `dependency-cruiser` and one small concrete affected-owner resolver;
5. prove traversal through lower FSD layers, widget recording + continued traversal, page/pane terminal recording, app/global fallback, dynamic/unresolved fallback, and status-aware add/remove/move behavior;
6. migrate existing application E2E specs to target directories/suffixes while preserving current desktop/mobile applicability;
7. run both old mapping and new resolver in comparison/proof mode if needed during migration, but never use disagreement to narrow below the broader safe result;
8. remove `E2E_SCENARIO_SCOPES`, its validation, and obsolete mapping tests only after the structural/graph model fully owns the inventory.

Forbidden:

- keeping the old registry as permanent fallback metadata;
- adding tags to every E2E;
- building a generic graph service/framework;
- inferring business semantics from imports.

### Phase 4 — unit, mutation, performance, and release reclassification

Finish the remaining type semantics.

Required:

- unit affected selection delegates to Vitest native related/affected behavior and preserves full-unit fallback for unresolved relations;
- mutation has a validated project-owned target inventory and participates in default affected planning and complete `--full`;
- durable performance targets have exact measurable budgets and target ownership;
- current release/version/build/artifact/PWA/update checks are classified under `static`, `behavior`, `browser-integration`, `e2e`, or `performance` according to the contract they prove;
- no public `release` verification type is introduced.

### Phase 5 — remove compatibility debt

After all target mechanisms are executable and remaining consumers are migrated:

- keep the Pass B public type-only `--only` contract; do not reintroduce removed low-level public labels;
- remove `pnpm verify:release` when no external repository consumer still requires the alias;
- remove legacy `*.browser.spec.ts` discovery;
- remove obsolete central ordinary behavior/visual discovery;
- remove legacy root E2E naming/discovery;
- remove `E2E_SCENARIO_SCOPES` and related registry validation;
- remove transitional docs/comments that describe migrated compatibility mechanisms as current.

Do not remove a compatibility path merely to reduce file count; remove it only after its consumer inventory is empty.

## Storybook current state

`docs/testing/storybook.md` remains the authoring/workbench policy.

Current Storybook infrastructure already provides deterministic stories, Controls, isolated preview styling, theme modes, memory-router harness, selective Autodocs, and Storybook build proof. Preserve those capabilities during verifier migration.

For test naming/placement:

- current executable behavior owners may still use `*.browser.spec.ts` until preflight Pass C removes the legacy naming/discovery path;
- target behavior suffix is `*.behavior.spec.ts`;
- visual target remains `*.visual.spec.ts`;
- complete product scenarios stay E2E rather than Storybook fixtures.

Older Storybook examples using the legacy suffix describe current/historical executable state, not a second target naming model.

## Verification during the migration itself

Each risky pass requires focused proof of the mechanism it changes. Follow the preflight pass boundaries:

- **Pass A:** parser/internal type composition, target suffix discovery/exclusions, old+new compatibility, and mixed-release split equivalence;
- **Pass B:** canonical public type parsing, invalid combinations, type isolation/prerequisites, literal full semantics, and stale invocation handling;
- **Pass C:** owner-local behavior/visual/browser-integration discovery, classification, and add/remove/move fail-closed behavior;
- **Pass D:** E2E owner parsing, dependency traversal, fallback, inventory validation, direct/moved/removed spec behavior, additional-owner validation, and project applicability preservation;
- **Pass E:** Vitest-native related fallback, explicit mutation target validation/selection/full semantics, and performance discovery only for real durable budgets;
- **Pass F:** workflow/public-command inventory, release gate migration, and proof that removed compatibility mechanisms have no remaining consumers.

Do not use a green broad run as proof that ownership or fallback logic is correct. Resolver unit tests must prove the risk-specific cases.

GitHub CI on the exact PR head remains the final automatic repository gate.

## Completion criteria

The redesign migration is complete when:

- `pnpm verify` is the normal project verification entry point;
- default scope is changed files/statuses relative to `develop`;
- public `--only` exposes only verification types;
- every independently discovered spec is deterministically classified by target suffix;
- unit uses Vitest native affected/related selection with safe fallback;
- behavior, visual, browser-integration, and local performance proof use truthful owner-local placement;
- E2E primary ownership comes from `tests/e2e/{pages,widgets}/<Owner>` structure;
- E2E changed-source impact comes from `dependency-cruiser` reverse dependencies to affected widgets/pages;
- exceptional additional E2E owners are minimal and validated;
- the manual E2E source-to-spec registry is gone;
- status-aware add/modify/remove/move handling cannot silently skip proof;
- uncertainty widens only the affected type unless uncertainty itself is cross-type;
- structural invalidity fails verification;
- mutation participates in literal `--full`;
- release-sensitive checks have no separate public type;
- legacy suffixes, aliases, mappings, and ordinary central dumping grounds have no remaining consumers;
- `pnpm verify --full` runs all types, all tests/specs, and all registered mutation/performance targets without narrowing.
