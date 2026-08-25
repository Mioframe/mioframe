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
- Public `--only` exposes exactly the canonical verification types: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`. Low-level leaf labels remain private verifier identifiers for execution, logs, weights, locks, and diagnostics.
- `pnpm verify:release` still aliases `pnpm verify --full` as transitional compatibility; final alias removal remains a later pass.

### Static

- format, Oxlint, ESLint, type-check, instruction compatibility, Storybook build, build/release configuration checks, and related deterministic operations remain separate internal labels/checks composed under the public `static` type.
- removed files are projected away from direct formatter/linter child-command inputs where required.
- Storybook buildability is a static proof; GitHub duplicate-build avoidance is an internal execution optimization rather than a public fallback flag.

### Unit

- Vitest is the unit runner and is exposed publicly as the `unit` verification type.
- current automatic unit selection does not yet fully implement the target native related/affected model for all source/test-support changes.
- current `*.test.ts` and supported script-test naming remains executable.

### Storybook behavior

- Storybook stories are colocated under `src/**/*.stories.*`.
- surviving ordinary isolated UI browser proof now uses the target `*.behavior.spec.ts` suffix at truthful owners under `src/**`; the router-harness infrastructure proof is colocated under `.storybook/router/`.
- legacy `src/**/*.browser.spec.ts` discovery and ordinary central `tests/e2e/storybook/*.spec.ts` assertion ownership have been removed after their inventories were migrated.
- `tests/e2e/storybook/storybook.testUtils.ts` remains execution support only; it is not an assertion owner or scenario registry.
- owner-local behavior selection is filesystem-derived from target suffix and placement, with full-lane fallback for shared Storybook/runtime infrastructure.

Target difference for behavior suffix/ordinary ownership: none. Later passes may remove other unrelated compatibility, but must not restore central scenario mapping or the legacy suffix.

### Visual

- `*.visual.spec.ts` is the target suffix and `visual` is the public verification type.
- surviving ordinary visual assertions and their screenshot baselines are owner-local under `src/**`.
- mixed central visual suites were split so computed-style/geometry/focus behavior moved to behavior proof while screenshot assertions remained visual proof.
- ordinary central `tests/e2e/visual/**/*.spec.ts` discovery/fallback has been removed. `tests/e2e/visual/storybook.ts` remains a shared deterministic Storybook-opening/stabilization helper only.
- owner-local baseline resolution is filesystem-derived; unresolved broad rendering impact still widens safely to the full visual type.

Target difference for ordinary visual ownership: none.

### Browser integration

- `browser-integration` is a public verification type and the managed-update/artifact runtime corpus uses target `*.browser-integration.spec.ts` ownership under `src/shared/service/appUpdate/`.
- the managed-update corpus remains executed through `playwright.release.config.ts` and `scripts/e2eReleaseContainer.mjs` because those existing execution boundaries preserve built-artifact, fresh-container, and cross-engine semantics; this is execution infrastructure, not release ownership.
- direct moved browser-integration specs and `src/shared/service/appUpdate/**` production changes participate in ordinary type-local affected planning through `scripts/lib/browserIntegrationRisk.ts`, reusing the existing `artifact` and `managed-updates-browser-integration` leaves.
- Pass D added the ordinary entity-owned `src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts`; the private `browser-integration-local` leaf executes ordinary owner-local browser integration through `scripts/browserIntegration.mjs` and the existing `runPlaywrightInContainer` boundary.
- the managed-update browser-integration leaf preserves three ordered fresh-container groups; ordinary runtime groups are Chromium, while the narrow lifecycle smoke remains Firefox/WebKit.
- the prior WebKit cross-engine flake was traced to owner-local test synchronization across the production watchdog's expected rollback reload; the correction preserves the existing polling budget and browser/runtime contract, and Pass C re-review accepted the resulting deterministic proof.

Target difference for browser-integration suffix/owner placement: none. The retained release-named runner/config/container files are internal execution mechanisms and may remain while they are required for the runtime contract.

### Application E2E

- application E2E assertion specs now use target `*.e2e.spec.ts` ownership only under `tests/e2e/pages/<Owner>/**` and `tests/e2e/widgets/<Owner>/**`;
- the former root E2E files and the three `tests/e2e/release/*.spec.ts` assertion owners have been migrated; release fixtures/support may remain under `tests/e2e/release/`;
- the three release-grade product scenarios are owner-local under `productionArtifact/` and retain the existing release/fresh-container execution leaves rather than being collected by ordinary dev-app Playwright;
- `scripts/lib/e2eRisk.ts` now uses structural primary owners plus one dependency-cruiser reverse graph; the manual `E2E_SCENARIO_SCOPES`, standalone exception metadata, and production source-prefix -> spec mapping have been removed;
- `scripts/lib/e2eProjectApplicability.ts` remains the independent recursive `desktop | mobile | both` registry for target E2E paths;
- exceptional additional ownership is represented only by validated Playwright `_mioframe-owner` annotations; the current migrated inventory requires zero such annotations;
- `dependency-cruiser@18.2.0` is installed and locked, but the real Mioframe graph acquisition/selection proof is still required before Pass D acceptance;
- the current Playwright ownership-inventory collector still invokes Playwright `--list` directly on the host. This violates the Pass D container/single-run amendment and is the remaining execution correction before acceptance. The correction contract is `docs/testing/verify-redesign-pass-d-correction.md` and active findings are in `scripts/REVIEW.md`.

Target difference for E2E ownership: the structural layout, owner model, project applicability, special production-artifact routing, and manual-registry removal have landed. Pass D is not architect-accepted until ownership metadata collection is containerized through the existing Playwright boundary and the installed dependency-cruiser adapter is proven against the real repository graph.

### Mutation

- Stryker and verifier-managed mutation execution already exist under the public `mutation` verification type.
- literal `pnpm verify --full` executes the complete inventory currently configured by `stryker.config.mjs` without an affected `-m` override.
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
| behavior suffix | target `*.behavior.spec.ts`; legacy `*.browser.spec.ts` discovery removed | `*.behavior.spec.ts` |
| visual suffix | target owner-local `*.visual.spec.ts`; ordinary central visual spec discovery removed | `*.visual.spec.ts` |
| browser integration | target `*.browser-integration.spec.ts` is owner-local and type-local planning is active for both managed-update and ordinary browser-storage owners; managed-update proof retains release runner/container infrastructure for execution semantics | `*.browser-integration.spec.ts` next to runtime owner |
| E2E suffix/location | target `tests/e2e/{pages,widgets}/<Owner>/**/*.e2e.spec.ts`; no root/release assertion ownership remains | same structural target |
| E2E impact | structural owner + dependency-cruiser planner is implemented and the manual registry is gone; Pass D review still requires real graph proof and containerized Playwright metadata collection | reverse dependency graph -> product owner with containerized validated Playwright metadata |
| unit impact | current planner behavior | Vitest native related/affected + safe fallback |
| release | private release-oriented leaf labels, runner/config names, and `verify:release` alias remain transitional execution compatibility | no public release type; checks classified by proof type and `pnpm verify --full` is canonical |
| mutation in full | complete current Stryker-configured inventory | complete validated explicit mutation target inventory |
| `--full` | literal complete current inventories with no narrowing; mutation uses current Stryker inventory and persistent performance inventory is currently empty | literal all types/all target specs/all registered mutation and performance targets |

Agents implementing the redesign must not treat remaining transitional aliases or execution-file names as durable architecture.

## Migration capability phases

The phases below describe capability transitions and compatibility dependencies; they are not the concrete coding sequence for this redesign. **Pass A–F in `docs/testing/verify-redesign-implementation-preflight.md` is the authoritative implementation order and pass-boundary contract.** In particular, Pass A establishes target discovery and splits mixed release proof before Pass B changes the public CLI, even though public CLI and release reclassification are described in separate capability phases below.

### Phase 0 — architecture and rules

Status on `architecture/verify-redesign`: **Pass A, Pass B, and Pass C are architect-accepted. Pass D implementation has landed but architect review is blocked on `scripts/REVIEW.md`; the active correction contract is `docs/testing/verify-redesign-pass-d-correction.md`. Pass E must not start yet.**

Required:

- canonical `docs/testing/architecture.md` expresses the accepted target;
- this migration plan distinguishes current executable state from target;
- verification-facing skills and repository rules use verification types rather than durable low-level labels;
- older verifier design documents are treated as legacy implementation records, not competing target architecture.

No additional verifier runtime architecture change is required in this phase beyond closing the active Pass D correction.

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
- current `verify:release` and remaining ownership compatibility stay only until their later pass consumers are migrated.

### Phase 2 — spec taxonomy and local owner migration

Status: **complete and architect-accepted.**

Make independent test types machine-classifiable by suffix and placement.

Implemented in Pass C:

- ordinary behavior uses owner-local `*.behavior.spec.ts`; legacy `*.browser.spec.ts` discovery is removed;
- visual uses owner-local `*.visual.spec.ts` and colocated baselines; ordinary central visual assertion discovery is removed;
- managed-update/artifact browser-runtime specs use owner-local `*.browser-integration.spec.ts` under `src/shared/service/appUpdate/`;
- application/runtime TypeScript and Vitest scopes exclude non-unit Playwright/performance spec suffixes correctly;
- direct/add/remove/move target specs participate in the relevant type-local planning/fail-closed behavior;
- the required Firefox/WebKit cross-engine lifecycle proof is preserved and deterministic after correcting the owner-local navigation synchronization race.

### Phase 3 — E2E structural ownership and reverse graph

Status: **implementation landed; architect review blocked on the two completion findings in `scripts/REVIEW.md`.**

The landed Pass D state already includes:

1. target E2E discovery and structural `pages/<Owner>` / `widgets/<Owner>` ownership;
2. filesystem primary-owner parsing and validation;
3. validated exceptional additional-owner metadata with zero annotations required by the migrated inventory;
4. `dependency-cruiser@18.2.0` and one concrete reverse-graph adapter;
5. target owner-local E2E migration with preserved desktop/mobile applicability;
6. owner-local production-artifact routing through existing release execution;
7. removal of `E2E_SCENARIO_SCOPES`, standalone exception metadata, source-prefix mapping, and mapping-specific validation/tests.

Remaining before acceptance:

1. route the ordinary/release Playwright `--list` ownership inventory through the existing `runPlaywrightInContainer`/guard boundary rather than invoking Playwright on the host;
2. prove the installed dependency-cruiser adapter against the real Mioframe `src/**` graph and demonstrate one real lower-layer -> structural owner selection without accidental full fallback.

Forbidden:

- keeping or restoring the old registry as fallback metadata;
- adding tags to every E2E;
- building a generic graph service/framework;
- inferring business semantics from imports;
- starting Pass E while the Pass D review remains blocked.

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

Already removed by Pass B/C/D and must not be restored:

- public low-level `--only` labels;
- legacy `*.browser.spec.ts` discovery;
- obsolete central ordinary behavior/visual assertion discovery and mapping;
- legacy root/release E2E assertion naming/discovery;
- `E2E_SCENARIO_SCOPES` and related source-to-spec registry validation.

Remaining later cleanup:

- remove `pnpm verify:release` when no external repository consumer still requires the alias;
- remove transitional docs/comments that describe migrated compatibility mechanisms as current.

Do not remove a compatibility path merely to reduce file count; remove it only after its consumer inventory is empty.

## Storybook current state

`docs/testing/storybook.md` remains the authoring/workbench policy.

Current Storybook infrastructure already provides deterministic stories, Controls, isolated preview styling, theme modes, memory-router harness, selective Autodocs, and Storybook build proof. Preserve those capabilities during verifier migration.

For test naming/placement:

- ordinary executable behavior owners use target `*.behavior.spec.ts` beside their truthful owner; `.storybook/router/routerHarness.behavior.spec.ts` is the justified Storybook-infrastructure owner;
- legacy `*.browser.spec.ts` discovery and central Storybook assertion specs are removed;
- `tests/e2e/storybook/storybook.testUtils.ts` remains a shared helper only;
- visual proof uses owner-local `*.visual.spec.ts` and colocated baselines;
- complete product scenarios stay E2E rather than Storybook fixtures.

Older Storybook examples using the legacy suffix describe historical executable state, not a second current naming model.

## Verification during the migration itself

Each risky pass requires focused proof of the mechanism it changes. Follow the preflight pass boundaries:

- **Pass A:** parser/internal type composition, target suffix discovery/exclusions, old+new compatibility, and mixed-release split equivalence;
- **Pass B:** canonical public type parsing, invalid combinations, type isolation/prerequisites, literal full semantics, and stale invocation handling;
- **Pass C:** owner-local behavior/visual/browser-integration discovery, classification, add/remove/move fail-closed behavior, and clean preservation of the managed-update browser matrix;
- **Pass D:** E2E owner parsing, dependency traversal, fallback, inventory validation, direct/moved/removed spec behavior, additional-owner validation, project applicability preservation, containerized Playwright metadata collection, and one real repository graph-selection proof;
- **Pass E:** Vitest-native related fallback, explicit mutation target validation/selection/full semantics, and performance discovery only for real durable budgets;
- **Pass F:** workflow/public-command inventory, release gate migration, and proof that removed compatibility mechanisms have no remaining consumers.

Do not use a green broad run as proof that ownership or fallback logic is correct. Resolver unit tests must prove the risk-specific cases.

Known flaky behavior is failed proof. A retry that happens to pass does not close a migration acceptance requirement unless the truthful root cause has been corrected and the owning proof is deterministic.

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
