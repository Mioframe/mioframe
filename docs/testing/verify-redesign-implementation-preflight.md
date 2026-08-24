# Verify redesign implementation preflight

- **Status:** Ready for implementation
- **Authoring source:** accepted `docs/testing/verify-redesign-architecture.md`, canonical `docs/testing/architecture.md`, executable-state `docs/testing/migration-plan.md`
- **Prepared against branch:** `architecture/verify-redesign`
- **Prepared against head:** `ed975ff9b86161d3a68e231ec40012f2dd4cdbf9`

## Goal

Implement the accepted unified `pnpm verify` architecture without replacing the verifier orchestration that already works.

The final state must provide:

- `pnpm verify` as the normal status-aware entry point against `develop`;
- public `--only` values `static | unit | behavior | visual | browser-integration | performance | mutation | e2e`;
- literal `--full` coverage of all types, all specs, and all registered mutation/performance targets;
- deterministic spec classification by suffix;
- owner-local behavior, visual, browser-integration, and local performance proof;
- Vitest-native affected unit selection;
- filesystem-owned E2E plus reverse dependency discovery of affected widgets/pages;
- type-local fail-closed widening and blocking validation for invalid structure;
- removal of replaced low-level public labels, legacy suffix/discovery compatibility, and the manual E2E source-to-spec registry after their consumers are migrated.

## Non-goals

Do not redesign product behavior, test assertions, Playwright container orchestration, verifier locks/timeouts/logging/status/resume, browser project applicability, Storybook workbench behavior, release publishing, or CI ownership.

Do not introduce a universal test graph, custom TypeScript/Vue dependency parser, generic registry/manager/service layer, Nx/Turborepo, or a new test DSL.

Proof cleanup is not part of this migration except where an existing file mixes target verification types and must be split to make classification truthful.

## Confirmed current state

The implementation already has reusable foundations:

- `scripts/verify.ts` owns command planning/execution, dependencies, locks, bounded Playwright execution, diagnostics, logs, and status/resume behavior.
- `scripts/lib/changedPaths.ts` already preserves add/modify/remove and both identities of moves/renames.
- `scripts/lib/verifyInvocation.ts` currently exposes low-level `--only` labels, stores `onlyLabel`, treats release labels as full-only, and explicitly excludes mutation from `--full`.
- `scripts/lib/e2eRisk.ts` currently owns `E2E_SCENARIO_SCOPES`, the manual source-prefix -> root E2E spec registry.
- `scripts/lib/e2eProjectApplicability.ts` separately owns `desktop | mobile | both` applicability for application E2E. This is valid persistent platform metadata and must be preserved.
- `playwright.config.ts` currently discovers root application E2E under `tests/e2e` while excluding release, Storybook, and visual subtrees.
- `playwright.storybook.config.ts` currently discovers legacy central Storybook specs and owner-local `src/**/*.browser.spec.ts`.
- `playwright.visual.config.ts` already supports `*.visual.spec.ts`, with mixed local/legacy-central discovery.
- `playwright.release.config.ts` currently runs a mixed suite containing static artifact invariants, browser/runtime contracts, and complete product flows.
- `vitest.config.ts` currently excludes E2E, `*.browser.spec.ts`, and `*.visual.spec.ts`; it must track the target non-unit suffixes during migration.
- `stryker.config.mjs` currently infers mutation candidates from source/test adjacency; the target requires explicit registered mutation ownership.
- `.github/workflows/verify.yml` currently invokes low-level labels directly.
- `.github/workflows/release.yml` currently uses `pnpm verify:release` as the `main` release gate; target command is `pnpm verify --full`.

## Ownership and public entry points

### Verifier ownership

`scripts/verify.ts` remains the single orchestration owner. Do not move orchestration into per-type services/managers.

`scripts/lib/verifyInvocation.ts` owns the public CLI invocation model.

Small type-specific resolver modules own only their own deterministic planning facts. Existing resolver modules may be adapted or replaced when their ownership model changes.

### Test ownership

- unit: current code owner, `*.test.ts`;
- behavior: truthful UI owner, `*.behavior.spec.ts`;
- visual: truthful UI owner, `*.visual.spec.ts`;
- browser integration: concrete entity/service/worker/runtime owner, `*.browser-integration.spec.ts`;
- local performance: concrete owner, `*.performance.spec.ts`;
- E2E: product composition owner encoded by `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/`.

E2E owner IDs are case-sensitive and come directly from existing direct directory names:

- `page/<Name>` must correspond to `src/pages/<Name>/`;
- `widget/<Name>` must correspond to `src/widgets/<Name>/`.

Do not maintain a second list of allowed page/widget names. Validate against the filesystem.

## Resolved implementation decisions

### 1. Public type CLI without rewriting leaf commands

Keep existing leaf command labels as private identifiers for logging, command weighting, locks, dependencies, and temporary migration compatibility. They are not public `--only` values.

Change the invocation model from `onlyLabel` to `onlyType` and define the eight canonical verification types in `scripts/lib/verifyInvocation.ts` (or one adjacent type-only module if needed to avoid a real import cycle; do not create a generic registry).

Each verifier leaf proof command gets exactly one verification type. Execution prerequisites may remain internal dependencies and do not become separate public proof types merely because they execute during another type.

`--only <type>` selects the leaf proof commands owned by that type plus required internal execution prerequisites. It must not select an assertion suite owned by another type.

Because current release suites mix several target types, split the mixed release proof before mapping those leaf commands to the public type CLI. Do not solve the mismatch by assigning one mixed suite to several public types.

Preserve `--base`, `--profile`, verbose, status/resume, and fix behavior where they do not alter proof taxonomy. `--repeat` becomes valid only for focused `--only behavior --files ...` execution. The current public `--storybook-build-ci-fallback` flag is removed; its GitHub optimization becomes internal planner behavior under the GitHub profile.

Bump `VERIFY_INVOCATION_VERSION`. Persisted invocation/status data from the previous label-based shape must be rejected as stale rather than reinterpreted.

`--full` rejects `--only`, `--files`, `--repeat`, and other narrowing combinations. `--profile` may remain because it changes execution environment, not coverage.

### 2. Static composition

`static` owns deterministic source/workspace/build/configuration invariants. Current leaf operations such as format, Oxlint, ESLint, type-check, instruction compatibility, Storybook buildability, release/version/config validation, publisher import validation, build/artifact integrity, and equivalent deterministic checks remain internal commands under `static` when that is the contract they prove.

Do not expose those names again as public `--only` values.

Storybook build reuse remains an execution optimization. When behavior or visual already builds the identical Storybook artifact, the planner may avoid duplicate compilation without merging proof ownership.

### 3. Target suffix migration

Before renaming any existing file, make each owning runner/configuration discover its target suffix and ensure Vitest/application TypeScript do not collect it as unit/runtime source.

Then migrate mechanically:

- all surviving ordinary `src/**/*.browser.spec.ts` -> same-owner `*.behavior.spec.ts`;
- existing `*.visual.spec.ts` keeps its suffix; finish migration of surviving ordinary central visual proof to truthful owners;
- browser/runtime release proof -> `*.browser-integration.spec.ts` next to the concrete runtime owner;
- application E2E -> owner directories and `*.e2e.spec.ts`;
- persistent performance proof, only where a durable budget exists -> `*.performance.spec.ts`.

Keep legacy discovery only until the last consumer is migrated. Do not leave dual target/legacy discovery permanently.

For currently central Storybook proof:

- `routerHarness.spec.ts` is Storybook-router infrastructure and moves next to `.storybook/router/routerHarness.ts` as behavior proof;
- `focusIndicator.spec.ts` moves to the shared focus-indicator owner under `src/shared/ui/State` as behavior proof;
- `colorOwnership.spec.ts` is Snackbar-owned composition proof and moves to the Snackbar owner as behavior proof; do not preserve a central cross-owner mapping merely because Material Button is a child;
- `overlayLifecycle.spec.ts` moves to the existing shared Overlay owner as behavior proof. Preserve its scenarios; do not use this verifier migration to redesign the Overlay contract.

### 4. E2E primary ownership and migration inventory

Current root E2E files are migration inputs, not target ownership units. Split a file when its tests clearly belong to different product owners; do not preserve a mixed file boundary merely to reduce moves.

Use this target inventory:

| Current root spec | Target ownership |
| --- | --- |
| `appSmoke.spec.ts` | split startup/OPFS flow to `page/HomePane`; Settings toggles to `page/Settings` |
| `appUpdatesNavigation.spec.ts` | Settings entry contract to `page/Settings`; dedicated update-pane navigation/state to `page/AppUpdatesPane` |
| `browserStoragePersistenceSmoke.spec.ts` | browser API startup/persistence mechanics to browser-integration owner `src/entities/browserStoragePersistence`; Home UI scenarios to `page/HomePane`; Settings UI scenarios to `page/Settings` |
| `databasePersistenceSmoke.spec.ts` | `widget/DocumentView` |
| `databaseItemFlows.spec.ts` | `widget/DocumentView` |
| `databasePropertyFlows.spec.ts` | `widget/DocumentView` |
| `databaseViewsAndQueryFlows.spec.ts` | `widget/DocumentView` |
| `reorderSurfaceBottomSheet.spec.ts` | `widget/DocumentView` |
| `reorderSurfaceTouch.spec.ts` | `widget/DocumentView` |
| `reorderSurfaceCancellation.spec.ts` | `widget/DocumentView` |
| `reorderSurfaceMouse.spec.ts` | `widget/DocumentView` |
| `reorderSurfacePersistence.spec.ts` | `widget/DocumentView` |
| `exportDocumentBrowserStorage.spec.ts` | `widget/RepositoryExplorerWidget` |
| `helpNavigation.spec.ts` | `page/Help` |
| `repoExplorerScreen.spec.ts` | `page/RepoExplorer` |
| `repositoryFlows.spec.ts` | `widget/RepositoryExplorerWidget` |
| `zipActionFlows.spec.ts` | `widget/RepositoryExplorerWidget` |

Preserve each scenario's existing desktop/mobile/both applicability when paths split/move. Refactor `e2eProjectApplicability.ts` so it validates target E2E paths rather than root-only paths; do not merge platform applicability into owner metadata.

### 5. Exceptional additional E2E owners

The current inspected inventory does not require additional-owner metadata after the mixed root files are split. Do not add annotations merely for redundancy.

Support the accepted exceptional mechanism for future/current genuinely cross-owner files using Playwright-native annotations:

```ts
test.describe('scenario group', {
  annotation: {
    type: '_mioframe-owner',
    description: 'widget/RepositoryExplorerWidget',
  },
}, () => {
  // ...
});
```

The primary owner always comes from the file path and must not be repeated as an annotation. Multiple additional owners use multiple annotations. `page/<Name>` and `widget/<Name>` are the only valid descriptions.

Do not parse TypeScript source text to discover annotations. Add one small tooling-owned Playwright inventory reporter/helper that uses Playwright's collected suite/reporter API in list/discovery mode, reads test annotations, and returns file -> additional-owner union. File-level planning intentionally widens to the entire spec if any test in that spec declares the additional owner.

Validation rejects malformed owner annotations, missing filesystem owners, wrong owner kinds, primary-owner duplication, and E2E specs outside the target ownership tree.

### 6. Reverse dependency discovery

Add `dependency-cruiser` as a dev dependency and use it only inside one concrete E2E affected-owner resolver.

Use `tsconfig.src.json` for TypeScript path resolution (`@shared`, `@feature`, `@entity`, `@widget`, `@page`, `@`). Include production `src/**` only.

Do not write a custom TS/Vue import parser and do not persist a graph registry/cache.

For every relevant changed production path:

1. resolve reverse dependencies;
2. traverse through `shared`, `entities`, and `features`;
3. on `src/widgets/<Owner>/**`, record `widget/<Owner>` and continue upward;
4. on `src/pages/<Owner>/**`, record `page/<Owner>` and stop that branch;
5. union owners from all changed paths;
6. select every E2E spec whose primary or additional owners intersect the result.

A relevant `src/app/**` change, `src/pages/routes.ts`, unresolved dynamic/global dependency, dependency-cruiser failure, or relevant production path with no safely established product owner selects full E2E.

A changed target E2E spec selects itself. Removed/moved specs use the previous path identity; if previous ownership cannot be validated, select full E2E.

### 7. Remove the manual E2E registry

During the migration, old and new E2E planners may be compared only as temporary proof. Any disagreement chooses the broader safe result.

After all application E2E specs are target-owned and resolver tests cover fallback/rename/removal:

- delete `E2E_SCENARIO_SCOPES`;
- delete source-prefix mapping resolution and its registry validation from `scripts/lib/e2eRisk.ts`;
- delete obsolete mapping-specific tests;
- remove any documentation that tells agents to maintain source-to-scenario mappings.

Do not retain the old registry as backup metadata.

### 8. Release-suite reclassification

The existing `tests/e2e/release` directory is mixed by proof type and must not survive as a public `release` lane.

Classify the current suite as follows:

| Current release spec | Target |
| --- | --- |
| `firstUserAndReturningUserSmoke.spec.ts` | E2E, `page/HomePane` |
| `managedReleaseDataCompatibility.spec.ts` | E2E, `widget/DocumentView` |
| `managedUpdatesActivationUi.spec.ts` | E2E, `page/AppUpdatesPane` |
| `managedUpdatesControllerArtifactIdentity.spec.ts` | static build/artifact invariant; remove Playwright classification |
| `managedUpdatesAutomaticCheck.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesControllerUpgrade.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesCrossEngineLifecycle.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesDevelop.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesLifecycle.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesMigration.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesRecovery.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesRollbackDiagnostics.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesUncontrolledWindow.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `managedUpdatesVueBootFailure.spec.ts` | browser-integration, `src/shared/service/appUpdate` |
| `productionArtifactSmoke.spec.ts` | split: file/manifest/generated-artifact assertions -> static; built-page/service-worker lifecycle assertions -> browser-integration under `src/shared/service/appUpdate` |

Preserve the current release fixture/build helpers when they are still the smallest mechanism required by browser-integration/E2E proof. Moving a spec does not require moving every mechanical fixture into production ownership.

`playwright.release.config.ts` and `scripts/e2eReleaseContainer.mjs` may remain as internal execution infrastructure while browser-integration/E2E built-artifact proof needs them, but they must no longer define a public verification type. Rename them only if the old name becomes actively misleading after the split; do not churn filenames for aesthetics.

### 9. Unit selection

Replace custom/default unit impact selection with Vitest's supported related/affected execution for changed source/test-support paths.

Direct changed unit tests still select themselves. Snapshot ownership stays deterministic. Removed/renamed/dynamic/global relations that cannot be represented safely select full unit.

Do not add a dependency-cruiser path for unit tests.

### 10. Mutation target ownership

Introduce one small explicit tooling-owned target list, preferably `scripts/lib/mutationTargets.ts`, with exactly:

```ts
interface MutationTarget {
  source: string;
  tests: readonly string[];
  reason: string;
}
```

Seed it from the currently intentional/high-risk mutation scope; do not mechanically register every source currently inferred by adjacency.

Validation requires existing source/tests, no duplicate source entry, at least one owning test, and non-empty risk reason.

Default mutation planning selects registered targets whose source or owning tests are affected. `--only mutation --files ...` uses the same relation. `--full` executes every registered target.

Invoke Stryker with exact registered source targets using its existing runner/configuration. Do not create `*.mutation.spec.ts`, self-registration, decorator/tag metadata, or adjacency inference as the new source of truth.

### 11. Performance

Do not invent a performance registry because the type exists. Add target discovery/validation only for real existing durable budgets. If the repository has no persistent performance specs when this migration lands, `--only performance` reports a valid skipped/empty registered inventory and `--full` has no performance target to execute.

Task-specific one-off measurements remain outside persistent verification.

### 12. CI migration

After the target CLI is executable, `.github/workflows/verify.yml` must invoke verification types rather than low-level labels.

Keep separate jobs where isolation/parallelism is already useful, but use type commands:

- static;
- unit;
- behavior;
- visual;
- browser-integration;
- e2e;
- mutation when affected targets exist;
- performance when registered targets exist.

Internal build/install/artifact prerequisites stay inside verifier planning. Do not expose a CI-only low-level public label API.

Replace the `main` release gate `pnpm verify:release --verbose` with `pnpm verify --full --verbose`. Remove the `verify:release` package alias only after repository consumers are migrated.

Preserve exact-head CI ownership and existing log upload behavior.

## Expected implementation surface

Primary files/modules expected to change:

- `package.json`, `pnpm-lock.yaml`;
- `scripts/lib/verifyInvocation.ts` and tests;
- `scripts/verify.ts` and `scripts/verify.test.ts`;
- `scripts/lib/e2eRisk.ts` and tests, eventually removed/reduced to the new owner planner as appropriate;
- new small E2E owner/graph/inventory helpers under `scripts/lib/`;
- `scripts/lib/e2eProjectApplicability.ts` and tests;
- `scripts/lib/storybookBehaviorRisk.ts` / `visualRisk.ts` only as required to complete target suffix/location migration;
- `scripts/lib/releaseImpact.ts` only as required to classify internal static/runtime proof, not to preserve a public release type;
- `scripts/lib/commandWeight.ts` if internal labels are renamed/removed;
- `vitest.config.ts`;
- `playwright.config.ts`, `playwright.storybook.config.ts`, `playwright.visual.config.ts`, and release/runtime Playwright configuration as needed;
- `stryker.config.mjs` plus the explicit mutation target owner;
- affected `src/**/*.browser.spec.ts`, central Storybook/visual proof, root application E2E, release specs/fixtures;
- `.github/workflows/verify.yml`, `.github/workflows/release.yml`, and any other repository consumer found by search for removed public labels/aliases;
- testing/verification docs only to remove migration compatibility statements after the corresponding implementation is complete.

Do not touch unrelated production feature behavior.

## Implementation pass order

### Pass A — classification foundations and mixed-release split

- add target suffix discovery/exclusions before moves;
- split mixed release proof into truthful static/browser-integration/E2E ownership while preserving current assertions;
- add internal verification-type ownership to leaf commands;
- add parser/plan tests before changing public CLI.

Focused proof: parser/type composition, target discovery, old+new compatibility, release split equivalence.

### Pass B — public CLI

- switch `onlyLabel` -> `onlyType`;
- expose only canonical types;
- make `--full` literal and include mutation inventory;
- bump invocation version;
- internalize Storybook CI fallback;
- preserve profile/base/status/resume/fix semantics.

Focused proof: invalid combinations, type isolation, prerequisites, full semantics, stale invocation handling.

### Pass C — owner-local spec migration

- rename ordinary behavior proof;
- finish ordinary visual colocation;
- move browser integration proof to runtime owners;
- update TypeScript/Vitest/Playwright discovery;
- remove legacy suffix/location compatibility once inventory is empty.

Focused proof: discovery, classification, add/remove/move fail-closed behavior.

### Pass D — E2E structural ownership

- add target owner directories and suffix discovery;
- split/move current E2E using the inventory above;
- preserve project applicability;
- implement additional-owner annotation validation;
- integrate dependency-cruiser reverse owner discovery;
- compare with the legacy registry conservatively while migrating;
- remove `E2E_SCENARIO_SCOPES` after replacement proof is complete.

Focused proof: direct spec, lower-layer -> widget -> page traversal, multi-owner annotation, app/global fallback, graph failure fallback, removed/moved paths, applicability preservation.

### Pass E — unit/mutation/performance final semantics

- Vitest-native related unit planning;
- explicit mutation targets and full participation;
- persistent performance discovery only if real budgets exist.

Focused proof: related empty/full fallback, target validation, affected mutation selection, literal full inventory.

### Pass F — CI and compatibility removal

- migrate workflows/package consumers to type CLI and `pnpm verify --full`;
- remove public low-level labels and `verify:release` alias after consumer search is empty;
- remove obsolete release/E2E/behavior compatibility paths;
- update migration plan from transitional to completed state.

Focused proof: workflow command inventory, no remaining removed-label consumer, full final planner contract.

Do not start the next risky pass while the previous pass has known failing focused proof. If implementation cannot complete all passes in one work session, stop at a pass boundary with the repository internally consistent.

## Required removals

The final PR must not leave parallel ownership models. Remove when their last consumer is gone:

- public low-level `--only` labels;
- `FULL_ONLY_LABELS` / mutation full exclusion semantics that encode the old model;
- public `--storybook-build-ci-fallback`;
- legacy `*.browser.spec.ts` discovery and files;
- obsolete central ordinary Storybook/visual proof locations;
- root legacy application E2E naming/location;
- `E2E_SCENARIO_SCOPES` and mapping validation/tests;
- release as a public proof lane/category;
- adjacency-inferred mutation ownership as the durable target source;
- `pnpm verify:release` after all repository consumers move to `pnpm verify --full`;
- stale documentation that describes any removed compatibility mechanism as current.

## TEST IMPACT

### Public verifier CLI and persisted invocation

- **Contract/scenario:** `--only` type isolation, literal `--full`, compatible execution profile/status/resume.
- **Primary proof owner:** `scripts/lib/verifyInvocation.test.ts` and `scripts/verify.test.ts`.
- **Additional proof:** command dependency/weight/status-resume tests where affected.
- **Existing proof:** current label/parser/full-mode tests.
- **New/updated proof:** canonical type acceptance/rejection, low-level-label rejection, full+narrowing rejection, mutation-in-full, stale invocation-version rejection, behavior repeat rules.
- **Risk/platform matrix:** Node tooling only; GitHub/local profile differences must stay explicit.
- **Durable ownership/impact updates:** invocation schema/version and public CLI docs/skills.

### Spec taxonomy and local ownership

- **Contract/scenario:** every standalone spec is classified by one suffix and discovered only by its owning runner.
- **Primary proof owner:** Playwright lane/config tests plus Vitest/config exclusion tests.
- **Additional proof:** resolver tests for owner-local add/remove/move cases.
- **Existing proof:** Storybook/visual mixed-discovery tests.
- **New/updated proof:** behavior/browser-integration/E2E/performance suffix discovery and legacy-removal assertions.
- **Risk/platform matrix:** Node discovery + Chromium behavior/visual/runtime execution as currently required.
- **Durable ownership/impact updates:** renamed/moved spec paths and snapshots.

### E2E affected-owner planner

- **Contract/scenario:** changed production source selects all affected widget/page-owned E2E and never silently misses unknown impact.
- **Primary proof owner:** new focused resolver tests under `scripts/lib/`.
- **Additional proof:** Playwright inventory/annotation validation and existing applicability tests.
- **Existing proof:** `e2eRisk.test.ts`, changed-path tests, applicability tests.
- **New/updated proof:** lower-layer traversal, widget+continued-page collection, multiple changed sources, no-owner/full fallback, dependency-cruiser failure, `src/app`/routes full fallback, direct/removed/moved E2E, additional-owner selection/validation.
- **Risk/platform matrix:** planner is Node-only; selected E2E retains existing desktop/mobile applicability.
- **Durable ownership/impact updates:** owner directories, annotation contract, removal of source-prefix registry.

### Release proof reclassification

- **Contract/scenario:** existing release-grade assertions remain protected but are owned by static, browser-integration, or E2E rather than a release type.
- **Primary proof owner:** the reclassified existing specs/checks.
- **Additional proof:** verifier type-selection tests proving no mixed suite leaks across `--only` types.
- **Existing proof:** current release Playwright specs and release validation commands.
- **New/updated proof:** split `productionArtifactSmoke`, controller artifact identity static check, target owner paths/suffixes.
- **Risk/platform matrix:** built artifact + service worker + current cross-engine scenarios must retain their current required browsers.
- **Durable ownership/impact updates:** Playwright config/discovery and CI type mapping.

### Unit affected selection

- **Contract/scenario:** changed source runs related Vitest proof; unresolved relation widens to all unit.
- **Primary proof owner:** verifier unit planner tests.
- **Additional proof:** existing Vitest unit suite.
- **Existing proof:** current unit selection tests.
- **New/updated proof:** native-related invocation, direct tests, zero-match diagnostic, deleted/renamed/full fallback.
- **Risk/platform matrix:** Node/Vitest only.
- **Durable ownership/impact updates:** none beyond planner logic.

### Mutation

- **Contract/scenario:** only explicit high-risk mutation targets are registered; affected targets run by default; all registered targets run in full.
- **Primary proof owner:** mutation target validation/planner tests.
- **Additional proof:** focused Stryker execution for representative registered targets.
- **Existing proof:** current mutation runner/config tests if present.
- **New/updated proof:** registry validation, affected source/test selection, no-target skip, full-all-target behavior.
- **Risk/platform matrix:** Node/Stryker only.
- **Durable ownership/impact updates:** explicit target entries with source/tests/reason.

### CI/release gate

- **Contract/scenario:** exact-head CI invokes only public type commands; `develop -> main` runs literal full verification.
- **Primary proof owner:** workflow configuration plus verifier CLI tests.
- **Additional proof:** first exact-head GitHub run after publication.
- **Existing proof:** current verification/release workflows.
- **New/updated proof:** workflow command search contains no removed low-level public labels/`verify:release` consumer.
- **Risk/platform matrix:** GitHub Actions profile; release gate remains Ubuntu controlled environment.
- **Durable ownership/impact updates:** workflow commands only; CI remains architect-owned.

## Final verification

Coding work should use focused verifier-managed proof after each risky pass. Do not require a duplicate broad local handoff gate.

Before handoff, the implementation must at least have exercised the focused owners listed in `TEST IMPACT`, using the current executable CLI at the start of a pass and the target type CLI after it becomes executable.

The final repository state must satisfy these inspectable checks:

1. search finds no public use of removed low-level `--only` labels;
2. search finds no `*.browser.spec.ts` file/discovery reference except historical documentation intentionally retained as history;
3. search finds no `E2E_SCENARIO_SCOPES` or equivalent production-path -> E2E-spec registry;
4. every target E2E spec has a valid path-derived primary owner and valid project applicability;
5. every non-unit target suffix is excluded from Vitest/application runtime collection and included by exactly its owning runner;
6. `pnpm verify --only <type>` is type-isolated for all eight public types;
7. `pnpm verify --full` contains all type inventories including all registered mutation targets and performs no affected narrowing;
8. `pnpm verify --full --only ...` and `pnpm verify --full --files ...` fail before execution;
9. E2E graph uncertainty widens to all E2E while structural invalidity fails;
10. repository workflows use type CLI and the `main` release gate uses `pnpm verify --full`.

Exact-head GitHub CI remains the final automatic repository gate after the architect publishes/reviews the implementation.

## Forbidden

- inventing a ninth public verification type;
- retaining `release` as a public type/label after migration;
- assigning a mixed assertion suite to several types instead of splitting it;
- building a custom import parser or generic graph framework;
- using dependency-cruiser for unit selection;
- owner tags on ordinary E2E files;
- a second E2E owner registry or path-to-test mapping table;
- parsing agent prose/`TEST IMPACT` at runtime;
- weakening unknown-impact fallback to gain speed;
- treating invalid structure as a harmless full fallback;
- changing existing E2E desktop/mobile applicability without a separate audited reason;
- changing product behavior or test meaning merely to simplify migration;
- deleting old discovery/mappings before the replacement executes and is proven;
- rewriting locks, timeouts, container execution, logging, status/resume, or other stable verifier orchestration without concrete incompatibility.

## Readiness

**Ready for implementation.**

Architecture, ownership, public contracts, migration order, mixed release classification, E2E owner model, additional-owner metadata, graph boundary, fallback behavior, suffixes, mutation ownership, and CI target are resolved. Implementation may stop only if current code reveals a concrete incompatibility that changes one of those accepted contracts; implementation-detail choices that preserve them do not require a new architecture design.
