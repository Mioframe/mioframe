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

## Current executable state

### Completed foundation

- Git-backed changed-path planning preserves deletion and both sides of rename through `scripts/lib/changedPaths.mjs`.
- Existing consumers receive a compatibility projection and must avoid passing removed files to child commands.
- Storybook stories are already colocated with source owners.
- Vue component-contract tests are already colocated as `*.test.ts`.
- Material library family ownership is established under `src/shared/ui/material`.
- Storybook Essentials provides Controls and other built-in workbench tools.
- Storybook currently configures representative desktop/mobile viewports and app/surface backgrounds.
- Storybook currently installs a minimal Vue Router memory history needed by existing shared overlay primitives.

### Still transitional

- The current Storybook memory router exposes only a minimal `/` route and is not yet the reusable per-story routing harness defined by `docs/testing/storybook.md`.
- Playground/Controls authoring is not yet normalized across reusable UI stories.
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
- no Playwright runtime/discovery behavior changes in this stage;
- target colocated specs are not described as already executable;
- Storybook is explicitly a developer workbench with catalogue navigation, Playground/Controls, visual sandbox, and isolated routing responsibilities.

### Stage S0.5 — Storybook workbench foundation

Implement the interactive developer-workbench behavior before moving Playwright specs.

Scope:

- keep Storybook's native manager/sidebar as the catalogue navigation surface;
- retain Vue docgen-driven Controls and establish the args-driven Playground convention on a small representative set rather than mass-rewriting stories;
- retain/configure representative viewport, background, measure/outline, and layout behavior for manual appearance inspection;
- replace the current minimal `/` memory-router setup with one small Storybook-owned routing harness;
- allow a story to provide deterministic initial location and the minimum story-owned route records needed for path/query/hash/params and `RouterLink`/`useRoute`/`useRouter` behavior;
- isolate/reset router state between stories;
- keep copied Storybook URLs useful for story address and serializable args;
- add focused Storybook infrastructure proof for the harness itself where needed.

Architecture constraints:

- use real `vue-router` memory history rather than a fake router API;
- do not import the production application router, route guards, stores, auth, persistence, services, network setup, or product bootstrap;
- do not create a generic story DSL or a second component catalogue;
- do not mirror public Vue props manually in a global Controls registry;
- do not add production props merely for Storybook;
- do not copy Material/application theme token values into Storybook-specific theme infrastructure.

Acceptance:

- a representative configurable component has a useful args-driven Playground with inferred Controls and only minimal explicit `argTypes` where inference is insufficient;
- a representative routing-aware reusable surface can start at a deterministic route, read route state, navigate, and use back/forward without product bootstrap;
- switching stories does not leak previous route state;
- viewport/background/layout controls remain usable for free manual inspection;
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
- Storybook provides the documented Playground/Controls, visual sandbox, and isolated reusable routing workbench without product bootstrap;
- Storybook browser/visual proof is owned by the truthful UI owner and physically colocated after its lane supports discovery;
- ordinary colocated Storybook relations do not require duplicate registry metadata;
- explicit mappings remain only for truthful non-local/cross-cutting relations and centralized product scenarios;
- Storybook infrastructure smoke is explicitly justified rather than treated as component ownership;
- visual baseline ownership handles add/modify/delete/rename safely;
- application E2E remains centralized and fail closed for unknown relevant product impact;
- proof ownership contains no known behavior-in-visual or product-in-component duplication;
- focused release proof, persistent mutation ownership, and any later project filtering satisfy their own acceptance gates;
- target and current executable state are no longer different, allowing transitional Storybook location notes to be removed.
