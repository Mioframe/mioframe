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

### Still transitional

- Playground/Controls authoring and controlled args round-trip are established as a convention on one representative component (`MDCheckbox`); repository-wide normalization across other reusable UI stories remains later migration work.
- Selective Autodocs usage is established as a convention on one representative public Material component (`MDButton`); broader selective adoption across other public reusable UI remains later migration work.
- Storybook catalogue title normalization (matching the target hierarchy exactly, e.g. `shared/ui/...` -> `Shared/...`) remains Stage S6; S0.5 only added deterministic ordering without renaming existing titles.
- Some resolvers still use resolver-specific result shapes rather than one shared `skip | focused | full | invalid` contract.
- Unit selection does not yet fully use the durable related-test/snapshot target.
- Storybook behavior specs are still executed from `tests/e2e/storybook` and selected through the current resolver/mappings.
- Visual specs/baselines still use the current central visual execution structure.
- App E2E uses centralized scenario mappings and remains centralized by design.
- Some visual specs still contain behavior/computed-style/geometry proof that belongs elsewhere.
- Persistent mutation and release-impact migration remain separate work.

The transitional physical locations above are executable facts. Agents must not place colocated Playwright specs until the corresponding discovery pilot is merged.

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

Preferred pilot: Loading Indicator Material family.

Why:

- narrow family owner;
- existing colocated story/component proof;
- lower mixed-owner risk than Button;
- current Storybook browser spec already has one clear family relation.

Implement only the minimum tooling required to support one colocated `*.browser.spec.ts` while preserving current central discovery for all unmigrated specs.

Required behavior:

- Playwright discovers the pilot spec beside its owner;
- production TypeScript/runtime source excludes the Playwright spec;
- changed pilot spec selects itself;
- changed owner/story/owned fixture selects the pilot through deterministic local ownership;
- add/modify/delete/rename are covered;
- unresolved relevant impact selects full Storybook behavior;
- existing central specs remain runnable and mapped exactly as before.

Forbidden:

- visual migration;
- broad behavior-spec moves;
- generic Storybook runner/DSL;
- app E2E changes;
- Storybook catalogue normalization.

### Stage S2 — remaining Storybook browser migration

Move component/family/module-owned Storybook behavior specs incrementally after S1 is proven.

Rules:

- ordinary truthful local owner relations use naming/placement convention, not explicit registry entries;
- family/module specs may use one explicit mapping only when one sibling stem cannot express the real relation;
- cross-cutting foundations use explicit mapping or full-lane fallback;
- infrastructure smoke remains central and justified standalone;
- split mixed-owner suites only where contracts have distinct owners;
- preserve full-lane fallback until no legacy behavior spec depends on the old central ownership tree.

Acceptance before removing legacy central discovery:

- every behavior spec has deterministic local, explicit, or infrastructure ownership;
- current coverage is preserved or strengthened;
- deleted/renamed owner/spec cases cannot silently skip;
- complete Storybook behavior lane passes with only the new ownership model.

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
- Storybook infrastructure smoke is explicitly justified rather than treated as component ownership;
- visual baseline ownership handles add/modify/delete/rename safely;
- application E2E remains centralized and fail closed for unknown relevant product impact;
- proof ownership contains no known behavior-in-visual or product-in-component duplication;
- focused release proof, persistent mutation ownership, and any later project filtering satisfy their own acceptance gates;
- target and current executable state are no longer different, allowing transitional Storybook location notes to be removed.
