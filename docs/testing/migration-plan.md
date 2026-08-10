# Testing architecture migration plan

`docs/testing/architecture.md` defines the durable testing target. `docs/testing/storybook.md` defines Storybook ownership, developer-workbench behavior, and target placement. This document records the current executable repository state and the safe order for reaching those targets without reducing protection.

## Migration constraints

- Every migration PR must be independently safe to merge into `develop`.
- Preserve production behavior unless the PR explicitly changes a product contract.
- Preserve or strengthen current proof before narrowing execution or deleting legacy paths.
- Keep broad fail-closed fallback until a deterministic replacement is implemented and tested.
- Do not make `verify` depend on `TEST IMPACT` or any uncommitted agent report.
- Do not redesign proof ownership inside resolver implementation; architecture must already be resolved.
- Do not move a spec before the owning runner/configuration can discover it.
- Do not remove old discovery, mappings, or baselines until replacement ownership is proven on the same repository state.
- Add/move/remove/rename behavior must remain deterministic and must never silently skip relevant proof.
- Do not satisfy Storybook usability by importing product bootstrap, product routing, stores, persistence, services, or business behavior into stories.
- Do not satisfy Storybook theme or preview needs by copying production token/style ownership into `.storybook`.

## Current executable state

### Completed foundation

- Git-backed changed-path planning preserves deletion and both sides of rename through `scripts/lib/changedPaths.mjs`.
- Existing consumers receive a compatibility projection and must avoid passing removed files to child commands.
- Storybook stories are already colocated with source owners.
- Vue component-contract tests are already colocated as `*.test.ts`.
- Material library family ownership is established under `src/shared/ui/material`.
- Storybook Essentials provides Controls and other built-in workbench tools.
- Storybook currently configures representative desktop/mobile viewports and app/surface Material-token backgrounds, freely selectable; the default is the semantic `App` background, never checkerboard.
- Storybook preview isolates Canvas styling through `src/app/styles/base.css`, the same low-level entrypoint the application shell composes; the application shell (`src/app/styles/styles.css`) owns only `html`/`body`/`#app` layout on top of it.
- Material foundation owns an explicit `data-md-color-scheme="light"`/`"dark"` seam (`src/shared/ui/material/foundation/theme.css`); no attribute preserves the production `prefers-color-scheme` default. Storybook exposes this through a `System`/`Light`/`Dark` toolbar global that only sets/removes the attribute.
- Storybook installs a per-story Vue Router memory-history instance (`.storybook/router/routerHarness.ts`) through a small typed `parameters.router` shape (routes, initial location); a fresh app/router is created on every story remount, so route/history state does not leak between stories. Existing shared overlay primitives continue to work through the deterministic default `/` route.
- Storybook's native `storySort` gives the documented top-level namespaces (`Material 3`, `Shared`, `Entities`, `Features`, `Widgets`, `Pages`) deterministic ordering, case-insensitively matching already-colocated legacy titles, without renaming any existing story address.
- `MDCheckbox` (`src/shared/ui/Checkbox/MDCheckbox.stories.ts`) is the representative args-driven controlled Playground: Controls and direct interaction stay synchronized through `useArgs`.
- `MDButton` (`src/shared/ui/material/components/button/MDButton.stories.ts`) is the representative public Material component with selective Autodocs (`tags: ['autodocs']`) generated from the existing `vue-component-meta` docgen.
- A dedicated verifier label `storybook-build` runs `pnpm storybook:build` for changed `*.stories.*`, `.storybook/**`, and other Storybook-relevant configuration; it is selectable through `pnpm verify --only storybook-build`, not full-only, and runs in full verification.
- Vue component metadata is available to Storybook through the current docgen configuration.
- The Storybook behavior Playwright lane supports mixed discovery through one configuration: legacy `tests/e2e/storybook/**/*.spec.ts` plus owner-local `src/**/*.browser.spec.ts`.
- Owner-local browser selection is filesystem-derived from existing colocated specs, selects every applicable spec for an owner path, is independent of discovery order, and fails closed to the full behavior lane for removed/renamed colocated specs.
- Application and Storybook source TypeScript exclude `src/**/*.browser.spec.ts`; Node/tooling TypeScript and Playwright own those test files.

### Still transitional

- Playground/Controls authoring and controlled args round-trip are established as a convention on one representative component (`MDCheckbox`); repository-wide normalization across other reusable UI stories remains later migration work.
- Selective Autodocs usage is established as a convention on one representative public Material component (`MDButton`); broader selective adoption across other public reusable UI remains later migration work.
- Storybook catalogue title normalization (matching the target hierarchy exactly, e.g. `shared/ui/...` -> `Shared/...`) remains Stage S6; S0.5 only added deterministic ordering without renaming any existing story address.
- Some resolvers still use resolver-specific result shapes rather than one shared `skip | focused | full | invalid` contract.
- Unit selection does not yet fully use the durable related-test/snapshot target.
- Loading Indicator, MDCheckbox, MDNavigationPath, MDBottomSheetContainer2, Reorder, Material `MDButton`, and the legacy `src/shared/ui/Button` module now use owner-local browser specs. S2-A through S2-D are complete; `DialogForm` fallback-focus browser proof remains transitional-central and S2-E remains to be implemented.
- Visual specs/baselines still use the current central visual execution structure.
- App E2E uses centralized scenario mappings and remains centralized by design.
- Some visual specs still contain behavior/computed-style/geometry proof that belongs elsewhere.
- Persistent mutation and release-impact migration remain separate work.

The current mixed browser location is executable: migrated owners use colocated `src/**/*.browser.spec.ts`, while unmigrated owners retain the legacy central location. Agents must follow the stage authorization below rather than migrating additional specs merely because the generic discovery mechanism can execute them.

## Storybook ownership and workbench migration

Storybook migration is deliberately separated from the broader verifier migration. Do not combine these steps into one large PR.

### Stage S0 — architecture and rules

Owner: architecture/documentation.

Deliverables:

- canonical testing policy recognizes deterministic owner-local relations;
- `docs/testing/storybook.md` defines owner, developer workbench, story usage, proof boundaries, target placement, and current executable state;
- repository rules and testing skills route to the same contract;
- Material family workflow is referenced, not duplicated.

Acceptance:

- no contradiction remains between `docs/testing/architecture.md`, Storybook rules, `AGENTS.md`, or testing skills;
- no Storybook runtime or Playwright discovery behavior changes in this stage;
- target colocated specs and target workbench capabilities are not described as already executable;
- Storybook is explicitly a developer workbench with catalogue navigation, Playground/Controls, visual sandbox, generated documentation, isolated preview styling, and isolated routing responsibilities.

### Stage S0.5 — Storybook workbench foundation

Implement the interactive developer-workbench behavior before moving Playwright specs.

Scope:

- keep Storybook's native manager/sidebar as the catalogue navigation surface;
- isolate Canvas styling from the application shell while preserving the real normalization, fonts/icons, Material foundation/theme/tokens, and shared low-level styles required by reusable UI;
- retain Vue docgen-driven Controls and establish the args-driven Playground convention on a small representative set rather than mass-rewriting stories;
- for a representative controlled component, round-trip its public update event back into Storybook args so Controls and direct UI interaction stay synchronized;
- configure representative viewport, background, measure/outline, and layout behavior for manual appearance inspection;
- add explicit `System`, `Light`, and `Dark` Storybook theme modes through the production Material/theme owner rather than a Storybook token copy;
- keep the normal Playground on a truthful semantic surface; checkerboard/transparency backdrops remain specialized visual fixtures only;
- replace the current minimal `/` memory-router setup with one small Storybook-owned routing harness;
- allow a story to provide deterministic initial location and the minimum story-owned route records needed for path/query/hash/params and `RouterLink`/`useRoute`/`useRouter` behavior;
- isolate/reset router state between stories;
- keep copied Storybook URLs useful for story address and serializable args;
- configure deterministic native story ordering for the documented top-level namespaces without opportunistically renaming existing story addresses;
- prove selective Autodocs on representative public Material/reusable shared UI without making Autodocs mandatory for every FSD story;
- add one verifier-owned Storybook build check for relevant story/configuration changes, reusing the existing Storybook build entrypoint;
- add focused Storybook infrastructure proof for the workbench foundation where needed.

Architecture constraints:

- use real `vue-router` memory history rather than a fake router API;
- do not import the production application router, route guards, stores, auth, persistence, services, network setup, or product bootstrap;
- do not keep the complete application shell stylesheet as the permanent Storybook preview environment merely to obtain shared styling;
- reuse existing production-owned low-level style entrypoints or expose the smallest correctly owned entrypoint when one is missing; do not duplicate declarations in `.storybook`;
- Material/theme foundation owns Material theme mode application. `System` preserves the current production system-following behavior;
- if deterministic `Light`/`Dark` inspection requires a new override seam, implement the minimum foundation-owned seam while preserving the current production default; do not copy light/dark token values into Storybook configuration or fixture CSS;
- do not create a generic story DSL, theme DSL, or a second component catalogue;
- do not mirror public Vue props manually in a global Controls registry;
- do not create a global Storybook state store merely to synchronize controlled args;
- do not add production props merely for Storybook;
- do not make Autodocs a global requirement for feature/widget/page stories;
- do not create another Storybook build runner when `storybook:build` already owns the build operation;
- do not combine this stage with browser/visual spec relocation or catalogue title normalization.

Acceptance:

- Storybook Canvas no longer inherits unrelated application-shell viewport/layout/scroll/transition behavior while required shared production styling remains present;
- `System`, `Light`, and `Dark` are usable from the Storybook workbench, use one foundation-owned theme implementation, and do not change the application's existing default theme behavior;
- a representative configurable component has a useful args-driven Playground with inferred Controls and only minimal explicit `argTypes` where inference is insufficient;
- a representative controlled public value stays synchronized after either a Controls change or direct component interaction without a global story state store;
- a representative routing-aware reusable surface can start at a deterministic route, read route state, navigate, and use back/forward without product bootstrap;
- switching stories does not leak previous route state;
- viewport/background/layout/theme controls remain usable for free manual inspection;
- normal Playgrounds use a semantic surface, while checkerboard/transparency fixtures are opt-in specialized cases;
- native Storybook navigation has deterministic top-level ordering without changing existing story IDs merely for ordering;
- representative public Material/reusable shared UI can expose useful Autodocs from the real Vue metadata without a duplicated handwritten API catalogue;
- Storybook configuration and changed `*.stories.*` files select a verifier-managed static Storybook build check even when no browser/visual lane is otherwise selected;
- canonical visual stories may still pin deterministic globals independently from the free Playground;
- Storybook build and relevant focused verification pass;
- no browser/visual Playwright spec migration occurs in this stage.

### Stage S1 — Storybook browser discovery pilot

Status: **complete**.

Authorized and completed pilot: Loading Indicator Material family only.

Why:

- narrow family owner;
- existing colocated story/component proof;
- lower mixed-owner risk than Button;
- current Storybook browser spec has a clear family owner once its fixtures are local to that owner.

Final executable S1 state:

- one Storybook behavior Playwright configuration discovers both legacy central specs and owner-local `src/**/*.browser.spec.ts`, so discovery is mixed legacy plus colocated;
- `MDLoadingIndicator.browser.spec.ts` is colocated beside the Loading Indicator owner, and its Storybook fixtures are owner-local (the assertion opens the Loading Indicator-owned `LegacySurfaceIsolation` story rather than the Button-family `LegacySurfaceColorOwnership` story), so focused owner impact cannot silently omit the proof;
- production/Storybook TypeScript excludes colocated browser specs while tooling type-check includes them;
- resolver ownership is derived from the filesystem rather than a colocated-spec registry;
- an owner path selects every applicable matching owner-local colocated browser spec, including same-directory and nested-owner cases;
- changed existing specs select themselves;
- add, remove, and rename of colocated specs fail closed to the full Storybook behavior lane;
- colocated browser specs (`src/**/*.browser.spec.ts`) are excluded from Vitest's unit-tests scope, so a colocated-spec-only change does not run unit-tests and still selects the focused `storybook-behavior` lane;
- the old explicit Loading Indicator central mapping is removed; legacy centralized specs and mappings for all other owners remain intact and unaffected;
- Storybook behavior full-lane impact includes the production-owned Storybook preview style dependency closure imported by `.storybook/preview.ts` via `src/app/styles/base.css`:
  - `src/app/styles/base.css`
  - `src/app/styles/fonts.css`
  - `src/shared/ui/material/foundation/index.css`
  - `src/shared/ui/material/foundation/tokens.css`
  - `src/shared/ui/material/foundation/theme.css`
  - `src/shared/lib/md/index.css`
  - `src/shared/lib/md/typography.css`
  - `src/shared/lib/md/space.css`

Forbidden during S1:

- migrating another browser owner;
- visual migration;
- broad behavior-spec moves;
- generic Storybook runner/DSL;
- app E2E changes;
- Storybook catalogue normalization.

### Stage S2 — remaining Storybook browser migration

Status: **in progress; S2-A, S2-B, S2-C, and S2-D complete**.

S2 migrates ordinary component/family/module-owned behavior to the owner-local convention established by S1. It does not force genuinely cross-owner or Storybook-infrastructure proof into a false local owner. Central discovery remains while such central consumers exist.

#### Inventory and final ownership

- `mdCheckboxControlledArgs.spec.ts`
  - Contract: real pointer interaction round-trips controlled `checked` state through the MDCheckbox Storybook args contract.
  - Final owner: `src/shared/ui/Checkbox/MDCheckbox.browser.spec.ts`.
  - Current state: complete — migrated owner-local and the legacy registry mapping is removed.
- `navigationPath.spec.ts`
  - Contract: small Button geometry inside Navigation Path, horizontal overflow/scrolling, and final segment selection.
  - Final owner: `src/shared/ui/NavigationPath/MDNavigationPath.browser.spec.ts`.
  - Current state: complete — migrated owner-local and the legacy registry mapping is removed.
- `mdBottomSheetContainerKeyboardScroll.spec.ts`
  - Contract: Tab/Shift+Tab wrap keeps the focused control visible; non-Tab focus does not perform the keyboard-only scroll correction.
  - Final owner: `src/shared/ui/Sheets/MDBottomSheetContainer2.browser.spec.ts`.
  - Current state: complete — migrated owner-local under the existing cohesive `Sheets` module, with conservative module-wide selection and no duplicate registry mapping.
- `reorderSelfScrollableContainer.spec.ts`
  - Contract: pointer activation/recovery plus self-scroll, clipped-surface reveal, scroll-snap suppression/restoration, autoscroll lifecycle and release behavior.
  - Final owner: `src/shared/lib/reorder/reorderSelfScrollableContainer.browser.spec.ts`.
  - Current state: complete — migrated owner-local as a distinct spec; Reorder module changes conservatively select all four colocated Reorder browser specs.
- `reorderDocumentViewportFallback.spec.ts`
  - Contract: container → ancestor → document viewport autoscroll progression, visibility-first stopping, and release stopping every level.
  - Final owner: `src/shared/lib/reorder/reorderDocumentViewportFallback.browser.spec.ts`.
  - Current state: complete — migrated owner-local as a distinct spec; the replaced Reorder registry mapping is removed.
- `reorderFixedBoundary.spec.ts`
  - Contract: transformed-ancestor/fixed-surface autoscroll and release stopping.
  - Final owner: `src/shared/lib/reorder/reorderFixedBoundary.browser.spec.ts`.
  - Current state: complete — migrated owner-local as a distinct spec; the replaced Reorder registry mapping is removed.
- `reorderWrapLayout.spec.ts`
  - Contract: forward/backward cross-row reorder and direct-parent drag bounds in wrapping layout.
  - Final owner: `src/shared/lib/reorder/reorderWrapLayout.browser.spec.ts`.
  - Current state: complete — migrated owner-local as a distinct spec; Reorder ownership is now filesystem-derived with no duplicate mapping.
- `storybook.smoke.spec.ts`
  - Contract: MDButton Default renders an enabled, focusable interactive Button.
  - Final owner: `src/shared/ui/material/components/button/MDButton.browser.spec.ts`.
  - Current state: complete — this was not Storybook infrastructure proof. The assertion is preserved under the Material Button owner-local spec; the misleading central smoke classification and file no longer exist.
- `md-button-family.spec.ts`
  - Contract: mixed Material MDButton, legacy Button-module, and shared focus-indicator behavior.
  - Final ownership: split by truthful owner.
  - Current state: complete — MDButton-only contracts moved to `src/shared/ui/material/components/button/MDButton.browser.spec.ts`; MDIconButton/MDFab/MDExtendedFab-only contracts moved to `src/shared/ui/Button/LegacyButton.browser.spec.ts`; the shared focus-indicator integration remains central as `tests/e2e/storybook/focusIndicator.spec.ts` with one explicit cross-owner mapping. The stale/non-existent `src/shared/ui/LoadingButton/` mapping is removed. The file no longer exists.
- `dialogFormFallbackFocus.spec.ts`
  - Contract: real focus-trap activation with zero tabbable action controls uses the form fallback target and keeps Tab/Shift+Tab focus inside the dialog.
  - Final owner: `src/shared/ui/Dialog/DialogForm.browser.spec.ts`.
  - Current state: transitional central proof introduced after the original S2 inventory. S2-E must move the assertion owner-local and remove its explicit `dialog form fallback focus` registry mapping without changing the story ID or focus-trap behavior.
- `colorOwnership.spec.ts`
  - Contract: Snackbar inverse surface/message/action/close color behavior across Snackbar-owned contextual values and Material Button public contextual tokens.
  - Final owner: keep `tests/e2e/storybook/colorOwnership.spec.ts`.
  - Decision: justified cross-owner proof. Keep the explicit Snackbar + Button-token mapping rather than assigning false local ownership.
- `overlayLifecycle.spec.ts`
  - Contract: outside-interaction lifecycle across `onInteractionOutside`, Menu and Tooltips using the composed Overlay regression fixture.
  - Final owner: keep `tests/e2e/storybook/overlayLifecycle.spec.ts`.
  - Decision: justified cross-owner proof. Keep explicit mapping. Existing appearance assertions are preserved in S2 and may be reconsidered only in S5 proof cleanup.
- `routerHarness.spec.ts`
  - Contract: Storybook-owned memory-router initial state, RouterLink/push/back/forward behavior, and per-story route isolation.
  - Final owner: keep `tests/e2e/storybook/routerHarness.spec.ts`.
  - Decision: Storybook infrastructure regression proof, not a `src/shared/lib/router` production owner. `.storybook/**` remains full-lane impact and fixture-source mapping stays explicit.

`storybook.testUtils.ts` remains the current central mechanical Storybook behavior helper. Colocated specs may continue importing it as the S1 pilot does. Moving or replacing that helper is not required by S2 and would only add migration infrastructure without changing proof ownership.

#### Migration groups

Implement S2 as independently mergeable groups from current `develop`:

1. **S2-A — simple owner-local UI (complete):** `mdCheckboxControlledArgs.spec.ts` and `navigationPath.spec.ts` are now `src/shared/ui/Checkbox/MDCheckbox.browser.spec.ts` and `src/shared/ui/NavigationPath/MDNavigationPath.browser.spec.ts`; their replaced registry entries are removed. The generic owner-local resolver contract remains the only ownership mechanism; no owner-specific metadata was added.
2. **S2-B — Sheets module (complete):** `mdBottomSheetContainerKeyboardScroll.spec.ts` is now `src/shared/ui/Sheets/MDBottomSheetContainer2.browser.spec.ts`; its replaced registry entry is removed. The local resolver intentionally treats `Sheets/` as the owner root, so no second mapping was added to recover the old narrower exact-file selection.
3. **S2-C — Reorder module (complete):** all four Reorder browser specs are now distinct colocated `*.browser.spec.ts` files under `src/shared/lib/reorder`; the two replaced Reorder registry mappings are removed. The owner-local resolver intentionally selects all four for module-local changes rather than recreating the former narrower mapping split.
4. **S2-D — Button decomposition (complete):** `md-button-family.spec.ts` is split by Material Button, legacy `shared/ui/Button`, and cross-owner focus-indicator ownership; the old `storybook.smoke.spec.ts` assertion is folded into the Material Button local proof (`src/shared/ui/material/components/button/MDButton.browser.spec.ts`); legacy Button-module contracts moved to `src/shared/ui/Button/LegacyButton.browser.spec.ts`; the shared focus-indicator integration remains one central explicit spec, `tests/e2e/storybook/focusIndicator.spec.ts`. `storybook.smoke.spec.ts` and `md-button-family.spec.ts` no longer exist, and the stale `src/shared/ui/LoadingButton/` mapping is removed. Icon Button/FAB remain outside the canonical Material `button` family, as its architecture explicitly excludes those contracts.
5. **S2-E — DialogForm migration and final ownership audit:** move `tests/e2e/storybook/dialogFormFallbackFocus.spec.ts` to `src/shared/ui/Dialog/DialogForm.browser.spec.ts`, preserve its real focus-trap browser contract and story address, remove the replaced explicit DialogForm mapping, then validate that the remaining central behavior specs are exactly justified cross-owner/infrastructure proof (`colorOwnership`, `overlayLifecycle`, `focusIndicator`, `routerHarness`) plus the central helper. Keep central discovery because these are real consumers; do not remove it merely to make the directory empty.

S2-A through S2-D are complete. The next authorized implementation group is S2-E. Each remaining group starts from the then-current `develop` and preserves the assertions and story addresses it migrates. A group may adjust an owner-local fixture only when required to eliminate a real cross-owner fixture dependency; it must not redesign product behavior or clean up unrelated proof.

#### S2 architecture constraints

- Ordinary local ownership is expressed only by `*.browser.spec.ts` placement; do not add duplicate registry entries for migrated owners.
- The owner root for a colocated spec is its containing directory. Conservative same-module over-selection is acceptable when that directory is the truthful cohesive owner; do not introduce narrower metadata solely to reduce test count.
- Multiple browser specs in one owner directory are valid and are all selected. Reorder therefore keeps its four distinct specs.
- A central spec is valid only for a real cross-owner or Storybook-infrastructure contract. Its explicit source mapping must remain the smallest truthful relation supported by the existing resolver.
- `routerHarness.spec.ts` proves `.storybook/router/routerHarness.ts`; the `src/shared/lib/router` story files are fixtures, not a reason to claim shared-lib ownership.
- Material `button` owns `MDButton`; Icon Button and FAB contracts are explicitly outside that family architecture and remain owned by the existing `src/shared/ui/Button` module until their own Material migrations occur.
- Focus-indicator integration remains cross-owner in S2 because one State foundation is exercised against hosts from both the Material Button family and the legacy Button module. Consolidating that foundation proof is S5 work, not a prerequisite for file placement.
- `DialogForm` fallback-focus is an ordinary component-owned browser contract. Its current central placement is transitional only until S2-E; do not preserve an explicit mapping after owner-local migration.
- `colorOwnership.spec.ts` and `overlayLifecycle.spec.ts` remain central. Creating a local copy plus a cross-owner mapping would add metadata without reducing ownership complexity.
- Keep the current `openStory` helper and one Playwright Storybook runner; no new runner, generic registry DSL, mapping layer, or test helper framework.
- Do not change browser project coverage, screenshots, visual baselines, story titles/IDs, app E2E, or production behavior in S2.
- Do not use S2 to remove computed-style/appearance assertions or other existing proof merely because S5 may later choose a lower or different owner. S2 first preserves coverage while fixing physical and impact ownership.

#### Acceptance

S2 is complete when:

- every ordinary component/family/module browser contract listed above, including `DialogForm` fallback-focus, is colocated with its truthful owner;
- the old `storybook.smoke.spec.ts` infrastructure classification no longer exists and its MDButton assertion remains protected;
- the mixed Button suite no longer gives Material Button, legacy Button, and focus-indicator foundation one false owner;
- local owners have no duplicate explicit registry mapping;
- `dialogFormFallbackFocus.spec.ts` is removed from the central directory after its assertion moves to `src/shared/ui/Dialog/DialogForm.browser.spec.ts`, and its explicit mapping is removed;
- the remaining central specs are only `colorOwnership.spec.ts`, `overlayLifecycle.spec.ts`, `focusIndicator.spec.ts`, and `routerHarness.spec.ts`, each with truthful explicit or infrastructure ownership;
- the stale `src/shared/ui/LoadingButton/` behavior mapping is gone;
- coverage and story addresses are preserved during migration; proof cleanup remains deferred to S5;
- add/modify/delete/rename behavior for colocated specs remains fail closed as established by S1;
- complete `storybook-behavior` passes after every group and after the final ownership audit;
- legacy central discovery remains enabled while the justified central specs above exist.

### Stage S3 — visual discovery and snapshot pilot

Introduce one colocated `*.visual.spec.ts` owner and its deterministic snapshot directory while preserving all legacy visual execution.

Required behavior:

- Playwright discovers the colocated pilot visual spec;
- production TypeScript excludes it;
- snapshot ownership is deterministic for add/modify/delete/rename;
- changed component/story/spec/baseline selects the owner where resolvable;
- unresolved baseline ownership selects full visual;
- theme/fonts/icons/Storybook renderer/config remain broad fallback unless a complete stable consumer set is explicit;
- visual spec contains preparation plus bounded screenshot assertions only.

Do not combine this with browser discovery work.

### Stage S4 — remaining visual migration

Move remaining UI-owned visual specs and baselines after S3 is proven.

Rules:

- ordinary owner-local visual relations use colocation convention;
- non-local/cross-cutting impact uses explicit mapping or full fallback;
- do not rename stories/titles merely as part of file movement;
- preserve exact intended screenshot coverage before deleting old baseline paths.

Acceptance before removing legacy visual discovery:

- every visual spec/baseline has deterministic ownership or justified broad fallback;
- add/modify/delete/rename cases are covered by resolver tests;
- complete visual lane passes with the new ownership model;
- no behavior success criteria remain necessary to keep a baseline meaningful.

### Stage S5 — proof ownership cleanup

Only after browser and visual ownership are stable:

- move reusable browser interaction out of visual specs;
- move deterministic/component contracts to the lowest faithful Vitest owner;
- move complete product outcomes to application E2E only when product composition owns them;
- remove proven duplicate assertions;
- consolidate generic foundation behavior at foundation owners;
- make browser helpers strict rather than recovery-oriented.

This stage changes proof ownership, not resolver architecture.

### Stage S6 — Storybook catalogue normalization

Normalize titles only after spec/baseline ownership is stable.

Target hierarchy:

```text
Material 3/Components/<Family>/<Component>
Material 3/Patterns/<Pattern>
Shared/<Slice>/<Owner>
Entities/<Slice>/<Owner>
Features/<Slice>/<Owner>
Widgets/<Slice>/<Owner>
Pages/<Slice>/<Owner>
```

Treat title/export renames as address changes because they may alter story IDs, URLs, and visual baselines.

## Other testing migration work

The Storybook sequence does not replace the remaining project-wide migration.

### Common lane-plan contract

Migrate resolvers to the small mechanical result shape:

- `skip` with reasons;
- `focused` with non-empty exact inputs and reasons;
- `full` with reasons;
- `invalid` with blocking errors.

Do not add product semantics to the shared helper.

### Static verification

Status-aware static planning must ensure:

- removed files never become formatter/linter targets;
- typed add/modify/delete/rename cannot silently skip required type-check;
- instruction-tree changes validate agent compatibility;
- shared static config selects the complete owning check.

### Unit selection

Durable target:

1. directly changed tests;
2. deterministic snapshot ownership;
3. changed source/test-support passed to supported Vitest related resolution;
4. full fallback for deleted/renamed/dynamic/global relations that cannot be represented safely.

Do not build a second persistent dependency graph.

### Application E2E

Application E2E stays centralized by design.

- changed app spec selects itself;
- stable product source-to-scenario impact remains explicit;
- bootstrap, cross-cutting service/worker protocols, E2E infrastructure, and unknown relevant product source use full fallback;
- common helpers default to full E2E unless every consumer is explicit and validated;
- desktop/mobile coverage must not be narrowed without a separate audited project-applicability migration.

### Release impact

Focused release selection remains separate work. It must eventually select exact build/artifact/release-smoke proof for known release-sensitive changes while retaining `pnpm verify:release` as the unconditional release-sensitive final gate when required.

### Mutation

Persistent mutation ownership requires explicit high-risk source/test targets and validation. Preserve current legacy mutation behavior until its replacement is complete.

### Performance

Do not create a performance registry without a durable named budget. One-off optimization claims remain task-specific reproducible measurements.

## Completion criteria

The testing migration is complete when:

- changed-path planning preserves add/modify/delete/rename status;
- migrated resolvers use inspectable `skip | focused | full | invalid` plans;
- static checks handle removed/moved files safely;
- unit selection uses direct tests, snapshot ownership, supported related resolution, and safe fallbacks;
- Storybook provides the documented Playground/Controls round-trip, isolated preview styling, `System`/`Light`/`Dark` visual sandbox, deterministic navigation, selective public Autodocs, and isolated reusable routing workbench without product bootstrap;
- relevant Storybook story/config changes have verifier-owned static-build proof independent of whether a browser/visual lane is otherwise selected;
- Storybook browser/visual proof is owned by the truthful UI owner and physically colocated after its lane supports discovery;
- ordinary colocated Storybook relations do not require duplicate registry metadata;
- explicit mappings remain only for truthful non-local/cross-cutting relations and centralized product scenarios;
- Storybook infrastructure proof is explicitly justified, and component-owned proof is not mislabeled as infrastructure smoke;
- visual baseline ownership handles add/modify/delete/rename safely;
- application E2E remains centralized and fail closed for unknown relevant product impact;
- proof ownership contains no known behavior-in-visual or product-in-component duplication;
- focused release proof, persistent mutation ownership, and any later project filtering satisfy their own acceptance gates;
- target and current executable state are no longer different, allowing transitional Storybook location notes to be removed.
