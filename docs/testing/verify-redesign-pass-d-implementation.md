# Verify redesign — Pass D implementation contract

- **Status:** Implementation landed; architect review blocked pending `verify-redesign-pass-d-correction.md`
- **Scope:** Pass D only — structural application E2E ownership, project applicability, exceptional additional-owner metadata, reverse dependency selection, and removal of the manual E2E source registry
- **Prerequisite:** Pass C architect-accepted
- **Active review:** `scripts/REVIEW.md`

## Goal

Replace the current root application-E2E layout and manual production-path -> spec mapping with the accepted structural model:

```text
tests/e2e/pages/<Owner>/**/*.e2e.spec.ts
tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts
```

The primary owner comes only from the path. Changed production source resolves affected page/widget owners through one `dependency-cruiser` reverse graph. Selected E2E specs are then derived from their path owner plus exceptional validated additional-owner annotations.

Preserve every existing E2E scenario, its desktop/mobile applicability, and the special built-artifact execution semantics of the three remaining release-grade E2E scenarios.

Pass D finishes E2E ownership. It does not start Pass E unit/mutation/performance work or Pass F CI/alias cleanup.

## Non-goals

- product behavior or E2E assertion redesign;
- a generic dependency-graph framework or persistent graph cache;
- dependency-cruiser for unit tests;
- routine owner tags on E2E files;
- a second owner registry or production-path -> spec table;
- moving mechanical shared E2E helpers merely for aesthetic colocation;
- replacing release Playwright/container infrastructure that is still required by built-artifact E2E;
- Pass E or Pass F work.

## Primary E2E owner contract

A target E2E spec is structurally valid only under one of:

```text
tests/e2e/pages/<Owner>/**/*.e2e.spec.ts
tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts
```

Owner IDs are case-sensitive:

```text
page/<Owner>
widget/<Owner>
```

Validation derives legal names from the current filesystem:

- `page/<Owner>` requires `src/pages/<Owner>/`;
- `widget/<Owner>` requires `src/widgets/<Owner>/`.

Do not introduce another list of legal page/widget names.

A target E2E spec outside these two trees is structural invalidity and fails E2E verification. It is not a harmless full-lane fallback.

## Exact migration inventory

Keep scenario meaning unchanged. Files with one truthful owner move mechanically and gain the `.e2e.spec.ts` suffix. Mixed files split exactly as described below.

### HomePane

Create:

```text
tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts
tests/e2e/pages/HomePane/browserStoragePersistence.e2e.spec.ts
tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts
```

`appSmoke.e2e.spec.ts` receives only the current `appSmoke.spec.ts` startup/OPFS scenario:

- loads the app and opens the OPFS root without a startup dialog.

`browserStoragePersistence.e2e.spec.ts` receives the Home UI scenarios from `browserStoragePersistenceSmoke.spec.ts`:

- Home shows browser-storage action/status;
- already-persistent Home state does not show a persistent enabled action;
- `persist() === false` produces non-blocking Home feedback;
- denial keeps the Home flow usable and Browser Storage accessible.

`productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts` is the existing release smoke moved without changing its production-artifact semantics.

### Settings

Create:

```text
tests/e2e/pages/Settings/settingsToggles.e2e.spec.ts
tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts
tests/e2e/pages/Settings/browserStoragePersistence.e2e.spec.ts
```

`settingsToggles.e2e.spec.ts` receives the two Settings keyboard-toggle scenarios from `appSmoke.spec.ts`:

- Starter examples Space/Enter toggle;
- Error diagnostics Space/Enter toggle when available.

`appUpdatesEntry.e2e.spec.ts` receives only the current `appUpdatesNavigation.spec.ts` scenario proving Settings exposes one App updates entry and no inline update controls.

`browserStoragePersistence.e2e.spec.ts` receives the two Settings UI scenarios from `browserStoragePersistenceSmoke.spec.ts`:

- Settings contains the storage section/item;
- already-persistent storage is represented as disabled/non-interactive.

### AppUpdatesPane

Create:

```text
tests/e2e/pages/AppUpdatesPane/appUpdatesNavigation.e2e.spec.ts
tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts
```

`appUpdatesNavigation.e2e.spec.ts` receives the remaining three current `appUpdatesNavigation.spec.ts` scenarios:

- selecting the Settings entry opens App updates;
- back navigation returns to Settings;
- initial unmanaged-controller state shows the running version/unavailable state and disables update actions.

`productionArtifact/managedUpdatesActivationUi.e2e.spec.ts` is the existing managed-update activation UI/data rollback product proof moved without changing its managed-release execution semantics.

### Help

```text
tests/e2e/pages/Help/helpNavigation.e2e.spec.ts
```

Move `helpNavigation.spec.ts` mechanically.

### RepoExplorer

```text
tests/e2e/pages/RepoExplorer/repoExplorerScreen.e2e.spec.ts
```

Move `repoExplorerScreen.spec.ts` mechanically.

### DocumentView widget

Create/move:

```text
tests/e2e/widgets/DocumentView/databasePersistenceSmoke.e2e.spec.ts
tests/e2e/widgets/DocumentView/databaseItemFlows.e2e.spec.ts
tests/e2e/widgets/DocumentView/databasePropertyFlows.e2e.spec.ts
tests/e2e/widgets/DocumentView/databaseViewsAndQueryFlows.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfaceBottomSheet.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfaceCancellation.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfaceMouse.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfacePersistence.e2e.spec.ts
tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts
```

Move the corresponding current root/release specs mechanically. `managedReleaseDataCompatibility` keeps its staged/hermetic A/B/A release behavior and existing `MANAGED_COMPAT_*` contract.

### RepositoryExplorerWidget

Create/move:

```text
tests/e2e/widgets/RepositoryExplorerWidget/exportDocumentBrowserStorage.e2e.spec.ts
tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts
tests/e2e/widgets/RepositoryExplorerWidget/zipActionFlows.e2e.spec.ts
```

Move the corresponding root specs mechanically.

## Browser-storage mixed-spec split

The current `browserStoragePersistenceSmoke.spec.ts` mixes browser API mechanics and product UI scenarios.

Create:

```text
src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts
```

Move only these current assertions there:

1. first app startup does not call `navigator.storage.persist()`;
2. the Home persistence action calls `navigator.storage.persist()`.

These prove the real browser StorageManager integration seam. Preserve their real-browser setup and assertions; do not rewrite them as happy-dom/unit mocks merely to make relocation easier.

The remaining Home/Settings scenarios move to the E2E owners listed above.

No assertion from the mixed source file may be lost or duplicated.

## Generic owner-local browser-integration execution

Pass C prepared `playwright.browserIntegration.config.ts` but the current verifier only has special appUpdate browser-integration leaves. The browser-storage split is the first ordinary non-appUpdate consumer, so Pass D activates the existing generic execution path with the minimum additional private plumbing.

Add one small wrapper:

```text
scripts/browserIntegration.mjs
```

It must reuse `runPlaywrightInContainer`, use `playwright.browserIntegration.config.ts`, pass through focused spec arguments, and preserve the existing Playwright container profile/lock ownership. Do not create another runner framework.

Add an internal package command such as:

```text
pnpm test:browser-integration
```

Add one private verifier leaf, named `browser-integration-local`, owned by the existing public `browser-integration` verification type. Give it the normal derived Playwright command timeout.

Extend the existing `scripts/lib/browserIntegrationRisk.ts` rather than creating a second browser-integration planner:

- direct existing non-appUpdate `src/**/*.browser-integration.spec.ts` changes select that spec for `browser-integration-local`;
- production source changes next to owner-local generic browser-integration specs select the sibling owner-local spec(s);
- removed/moved generic target paths must widen safely rather than being silently skipped;
- changes to generic browser-integration config/wrapper infrastructure run the complete generic owner-local browser-integration inventory;
- preserve the existing special `artifact` and `managed-updates-browser-integration` planning unchanged for `src/shared/service/appUpdate/**`.

Do not route appUpdate managed-release specs through the generic Chromium-only config.

## Production-artifact E2E execution boundary

The three moved release-grade E2E files have normal product owners, but they require production/managed-release execution that the ordinary application E2E config does not provide.

Encode that execution requirement structurally with the owner-local `productionArtifact/` subdirectory shown above. This subdirectory is execution classification only; primary ownership still comes from the enclosing `pages/<Owner>` or `widgets/<Owner>` directory.

### Ordinary application E2E config

Update `playwright.config.ts` to discover only target E2E paths:

```text
pages/**/*.e2e.spec.ts
widgets/**/*.e2e.spec.ts
```

and exclude `**/productionArtifact/**` from the ordinary dev-app E2E projects.

After migration, root `tests/e2e/*.spec.ts` assertion discovery must be gone. Shared support files such as `tests/e2e/helpers.ts` and `reorderSurface.testUtils.ts` may remain at `tests/e2e/` because they are helpers, not proof owners.

### Existing release execution

Keep `playwright.release.config.ts` and `scripts/e2eReleaseContainer.mjs` as internal execution infrastructure.

Repoint release-config E2E discovery to the target `productionArtifact/` paths plus the existing appUpdate browser-integration corpus. Remove `tests/e2e/release/*.spec.ts` assertion discovery after the three E2E specs move. `tests/e2e/release/fixtures/**` may remain where they are.

Repoint:

- `release-smoke` to `tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts`;
- managed-updates activation UI to `tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts`;
- managed-release data compatibility to `tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts`.

Preserve the existing fresh-container grouping and order in `managedUpdatesProof.mjs`.

### Focused E2E planning and special execution

The structural E2E owner resolver selects all E2E specs for an affected owner, including its `productionArtifact/` specs.

Partition selected paths only at execution time:

- ordinary selected E2E -> private `e2e` leaf / `pnpm e2e:container`;
- selected HomePane production-artifact release smoke -> existing private `release-smoke` leaf;
- selected AppUpdatesPane or DocumentView production-artifact managed-update E2E -> existing private `managed-updates-e2e` aggregate.

It is acceptable for the existing `managed-updates-e2e` aggregate to run both of its fresh-container groups when either of those two product specs is selected. This is a bounded safe widening and avoids inventing a second special-execution routing framework.

Refactor the current full-only release composition only as much as necessary so these two E2E special leaves can also be planned by focused/default E2E ownership. Static release checks remain full-only.

In literal `--full`:

- ordinary application E2E runs all non-`productionArtifact` target E2E through `playwright.config.ts`;
- the three production-artifact E2E run exactly once through the existing special release leaves;
- no production-artifact E2E is duplicated by the ordinary runner.

## Project applicability

Keep `scripts/lib/e2eProjectApplicability.ts` as the separate persistent spec -> platform registry. It is platform metadata, not ownership metadata.

Validation becomes recursive over all target E2E specs under `tests/e2e/pages/**` and `tests/e2e/widgets/**`, including `productionArtifact/` specs. Every target E2E spec must have exactly one applicability entry.

Preserve current scenario applicability exactly:

### `both`

```text
tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts
tests/e2e/pages/Settings/settingsToggles.e2e.spec.ts
tests/e2e/widgets/DocumentView/reorderSurfaceBottomSheet.e2e.spec.ts
```

### `mobile`

```text
tests/e2e/widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts
```

### `desktop`

Every other target E2E spec, including all three `productionArtifact/` E2E specs.

Do not infer project applicability from owner kind and do not merge it with primary/additional owner metadata.

Ensure ignore matching remains path-safe for nested target files; do not rely on basename uniqueness as a durable contract.

## Exceptional additional owners

The current migrated inventory requires no additional-owner annotations. Do not add any to existing specs merely for redundancy.

Implement the already accepted exceptional mechanism for future/current genuine cross-owner cases using Playwright-native annotations:

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

Rules:

- primary owner always comes from the file path;
- valid descriptions are only `page/<Name>` or `widget/<Name>`;
- the described owner must exist in `src/pages/` or `src/widgets/`;
- repeating the primary owner is invalid;
- malformed `_mioframe-owner` metadata is invalid;
- multiple genuine additional owners use multiple Playwright annotations;
- planning is file-granular: if any test in a spec declares an additional owner, that owner selects the complete spec.

Do not parse TypeScript source text.

Use one small tooling-owned Playwright list/inventory reporter/helper that obtains collected test annotations from Playwright's suite/reporter API. Collect/union target E2E inventory from the execution configs that own it: ordinary `playwright.config.ts` for ordinary target E2E and `playwright.release.config.ts` for `productionArtifact/` E2E. Filter the resulting inventory to target `.e2e.spec.ts` files and validate duplicates/omissions deterministically.

Inventory collection/annotation structural failure is an invalid E2E plan and must fail the E2E check; it is not permission to silently ignore additional owners.

Do not run browsers merely to collect metadata.

## Dependency-cruiser boundary

Add `dependency-cruiser` as a dev dependency at the currently verified compatible line:

```text
dependency-cruiser: ^18.2.0
```

The repository runs Node 24 and dependency-cruiser 18.2.0 supports Node 24. Use the package programmatically in one concrete E2E affected-owner graph adapter; do not generate a general `.dependency-cruiser` architecture rules file for this task.

Use `tsconfig.src.json` for path resolution and production `src/**` only. Build one in-memory dependency graph per relevant verifier invocation; do not persist/cache a graph registry.

Keep graph acquisition separate from the pure owner-selection logic so resolver tests can use small explicit graph fixtures without invoking dependency-cruiser.

## Reverse-owner traversal

For each relevant changed production path:

1. resolve reverse dependencies in the current production graph;
2. traverse upward through `shared`, `entities`, and `features`;
3. when reaching `src/widgets/<Owner>/**`, record `widget/<Owner>` and continue upward;
4. when reaching `src/pages/<Owner>/**`, record `page/<Owner>` and stop that branch;
5. union owners across all changed production paths;
6. select every target E2E spec whose primary or additional owners intersect the owner set.

If the changed file itself is inside a widget/page owner, apply the same owner rule immediately before traversing upward.

Do not infer business semantics from import names. The graph only answers reachability to structural product owners.

## Fail-closed behavior

Use the established distinction:

### Structural invalidity -> fail E2E

Examples:

- target E2E outside `pages/<Owner>` or `widgets/<Owner>`;
- primary owner directory does not exist in production;
- malformed/missing project applicability entry;
- malformed/unknown/duplicate-primary `_mioframe-owner` annotation;
- Playwright ownership inventory cannot be validated.

### Impact uncertainty -> full E2E

Examples:

- relevant `src/app/**` change;
- `src/pages/routes.ts` change;
- dependency-cruiser execution failure;
- unresolved/dynamic/global dependency that prevents safe owner reachability;
- relevant changed production path with no safely established product owner;
- removed/moved target E2E whose previous path cannot be validated;
- shared E2E helper/infrastructure/config changes with broad consumers;
- runtime-relevant package/config changes that already require full E2E.

Uncertainty widens only E2E. Do not turn graph uncertainty into another verification type.

## Direct/add/remove/move target specs

- changed existing/added target E2E spec selects itself;
- changed `productionArtifact/` target selects itself and is routed through its special execution leaf;
- moves use both changed-path identities supplied by `changedPaths.ts`;
- a removed/moved-away spec with a valid previous structural owner widens to the remaining E2E inventory for that owner where possible;
- if previous ownership cannot be validated, run full E2E.

No target E2E path may silently disappear because it no longer exists in the current filesystem.

## Manual registry removal

During implementation, the old `E2E_SCENARIO_SCOPES` planner may be compared with the new structural/graph result only as temporary proof. Disagreement must choose the broader safe result.

Before Pass D handoff, after target structure, graph, inventory, fallback, move/remove behavior, and project applicability are proven:

remove from durable implementation:

- `E2E_SCENARIO_SCOPES`;
- `APP_E2E_STANDALONE_SPECS`;
- production source-prefix -> E2E spec mapping logic;
- scenario-registry validation;
- mapping-specific tests/messages/comments.

Do not retain the registry as fallback metadata.

## Required final inventory

Before handoff:

- no root `tests/e2e/*.spec.ts` assertion specs remain;
- no `tests/e2e/release/*.spec.ts` assertion specs remain;
- ordinary E2E assertion specs exist only under `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` or `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts`;
- production-artifact E2E are the three exact owner-local specs described above;
- `tests/e2e/release/fixtures/**`, `tests/e2e/helpers.ts`, and other justified support-only files may remain;
- no `E2E_SCENARIO_SCOPES` or equivalent source-prefix mapping remains;
- current migrated inventory has zero `_mioframe-owner` annotations;
- every target E2E has exactly one project-applicability entry.

## Acceptance criteria

1. Every existing application/release E2E assertion survives exactly once at the fixed target owner above.
2. `appSmoke.spec.ts`, `appUpdatesNavigation.spec.ts`, and `browserStoragePersistenceSmoke.spec.ts` are split exactly by the stated contracts.
3. Browser-storage API mechanics live in the entity-owned browser-integration spec and execute through the generic browser-integration leaf.
4. No ordinary root `tests/e2e/*.spec.ts` remains.
5. No `tests/e2e/release/*.spec.ts` remains.
6. Primary E2E owner comes only from target path and is validated against current `src/pages`/`src/widgets` directories.
7. No second list of legal owner names exists.
8. Every target E2E has exactly one preserved project applicability entry.
9. The three `both` and one `mobile` paths above retain exactly those applicability values; every other target E2E is desktop.
10. Ordinary application Playwright discovery uses target `.e2e.spec.ts` owner paths and does not execute `productionArtifact/` specs.
11. The three production-artifact E2E retain their existing release/managed-release execution environment and run exactly once in full mode.
12. Focused owner selection can select production-artifact E2E and routes them through their existing special E2E leaves.
13. Managed-update E2E fresh-container group order remains equivalent.
14. Current inventory has no unnecessary additional-owner annotations.
15. The exceptional `_mioframe-owner` annotation mechanism is collected through Playwright, not source parsing, and is validated fail-closed.
16. `dependency-cruiser` is the only production import-graph engine used for E2E affected-owner discovery.
17. Graph acquisition runs once per relevant planning invocation, not once per source/spec.
18. Widget traversal records the widget and continues upward; page traversal records the page and stops that branch.
19. Multiple changed source paths union all reached owners.
20. `src/app/**`, `src/pages/routes.ts`, graph failure, unresolved relevant dependency, and no-owner relevant source widen to full E2E.
21. Structural invalidity fails instead of widening silently.
22. Direct/add/remove/move target E2E behavior is deterministic and cannot silently skip proof.
23. Shared E2E support/config remains full-lane fail-closed.
24. `E2E_SCENARIO_SCOPES`, standalone exception metadata, and mapping-specific validation/tests are removed after replacement proof.
25. No product behavior or test assertion is weakened.
26. No dependency-cruiser path is introduced for unit planning.
27. No Pass E work.
28. No Pass F workflow/`verify:release` cleanup.

## Verification

Use test-first for the new structural owner/parser, annotation inventory validation, dependency traversal, and planner fallback contracts.

Required focused deterministic proof includes at least:

- target primary-owner parsing/validation;
- missing/wrong owner structure -> invalid;
- additional-owner annotation union and validation;
- duplicate-primary/malformed/unknown additional owner -> invalid;
- current inventory requires no additional annotations;
- dependency graph lower-layer -> widget -> page traversal;
- widget recorded while traversal continues to page;
- page terminal behavior;
- multiple changed sources union owners;
- direct page/widget source ownership;
- `src/app` and `src/pages/routes.ts` -> full;
- dependency-cruiser failure/unresolved/no-owner -> full;
- direct existing/added E2E -> itself;
- removed/moved E2E -> owner widening/full fallback;
- project applicability recursive inventory and exact preserved values;
- generic browser-integration selection for browserStoragePersistence;
- production-artifact E2E partitioning and special-leaf routing;
- full mode has no duplicate production-artifact E2E execution;
- `E2E_SCENARIO_SCOPES` removal leaves no consumer.

Use the narrowest useful verifier-managed commands during implementation, for example focused `unit` over the changed tooling tests and focused `static` for touched tooling/config/package files.

Run representative real Playwright proof after migration:

- focused ordinary `e2e` covering at least one moved page owner and one moved widget owner, including the preserved mobile/both project filtering contract;
- focused `browser-integration` for `src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts`;
- focused E2E selection of a moved `productionArtifact/` spec proving it routes through the existing release execution rather than ordinary `playwright.config.ts`.

Do not run `pnpm verify --full` merely for Pass D.

Do not change assertions to make path migration pass. Known flakes remain failed proof.

## Constraints

- Code only. Do not edit `docs/**`, `AGENTS.md`, `.agents/skills/**`, or `REVIEW.md`.
- Work from the current `architecture/verify-redesign` HEAD containing this contract.
- Preserve all existing user scenarios and test assertions except mechanical import/path changes required by splitting/moving files.
- Preserve desktop/mobile applicability.
- Preserve release/managed-update built-artifact execution semantics.
- Preserve verifier locks, timeouts, logs, status/resume, and profile ownership except the new private generic browser-integration leaf receives the existing Playwright timeout/profile mechanism.
- Keep dependency-cruiser isolated to E2E owner discovery.
- Prefer small concrete modules under `scripts/lib/`; do not build a generic graph service.

## Forbidden

- inventing ownership for a scenario contrary to the exact inventory above;
- keeping root E2E files as aliases/copies after migration;
- keeping `tests/e2e/release/*.spec.ts` assertion ownership after migration;
- retaining `E2E_SCENARIO_SCOPES` as fallback metadata;
- adding ordinary owner annotations;
- parsing TypeScript text to find Playwright annotations or imports;
- a custom TypeScript/Vue dependency parser;
- a persistent graph cache/registry/service;
- a second owner registry;
- using dependency-cruiser for unit selection;
- routing managed-update browser-integration through the generic Chromium-only runner;
- routing production-artifact E2E through ordinary dev-app Playwright;
- weakening project applicability to simplify path matching;
- changing release E2E fixtures/runtime semantics merely because files move;
- deleting or weakening assertions;
- product code changes;
- Pass E unit/mutation/performance work;
- Pass F workflow or `verify:release` removal;
- editing architect-owned documentation/rules/review state.
