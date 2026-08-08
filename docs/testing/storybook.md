# Storybook architecture

This document defines Storybook ownership, file placement, and authoring rules for Mioframe. `docs/testing/architecture.md` remains the canonical project-wide policy for proof types and execution lanes. `docs/testing/migration-plan.md` records which parts of this target are already executable in the repository.

## Goal

Make isolated UI documentation and UI-owned browser/visual proof mechanical for coding agents:

- the owner is obvious from the repository path;
- stories and owner-specific proof are found next to that owner;
- product scenarios remain separate from reusable UI proof;
- impact selection is deterministic and fail closed;
- no agent invents a parallel Storybook structure, registry, or test system.

## Storybook role

Storybook is an isolated rendering surface for:

- documented supported UI states;
- deterministic browser fixtures;
- visual-regression inputs.

Storybook is not an FSD layer, product runtime, state-management layer, service boundary, or product-scenario owner.

Stories prepare deterministic state. Tests perform assertions and interaction.

## Ownership

The current UI owner owns its stories and owner-specific browser/visual proof.

### Material library

For `src/shared/ui/material`, the Material family is the owner:

```text
src/shared/ui/material/components/<family>/
├── <Component>.vue
├── <Component>.test.ts
├── <Component>.stories.ts
├── <Family>.browser.spec.ts       # target, optional
├── <Family>.visual.spec.ts        # target, optional
└── local fixture files            # rare, optional
```

A family-level spec is valid only when the observable contract belongs to the family. Do not create one spec per Vue file mechanically.

Material workflow artifacts, renderer boundaries, public API, token ownership, and family proof selection remain governed by `src/shared/ui/material/AGENTS.md`, `src/shared/ui/material/docs/architecture.md`, and the family `ARCHITECTURE.md`. This document does not duplicate that workflow.

### Other FSD UI

Outside the Material library, the truthful FSD component or cohesive local UI module is the owner:

```text
src/<layer>/<slice>/ui/
├── <Owner>.vue
├── <Owner>.test.ts
├── <Owner>.stories.ts
├── <Owner>.browser.spec.ts        # target, optional
├── <Owner>.visual.spec.ts         # target, optional
└── <Owner>BrowserFixture.vue      # rare, optional
```

Do not restructure a module only to create this exact shape. Colocate with the existing truthful owner.

### Product scenarios

Complete scenarios crossing several owners remain centralized under `tests/e2e`.

Storybook infrastructure smoke may remain centralized because it has no component, family, or FSD owner.

Stories, fixtures, specs, snapshots, and test helpers are never exported from production barrels.

## Current executable state

The durable target above is being migrated incrementally. Do not place a test where current Playwright discovery cannot execute it.

| Artifact                        | Current rule                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Vue component contract          | colocated `*.test.ts`                                                                                        |
| Storybook story                 | colocated `*.stories.ts`                                                                                     |
| Storybook browser behavior spec | keep the current executable location under `tests/e2e/storybook` until the browser-discovery pilot is merged |
| Visual spec and baseline        | keep the current executable visual location until the visual-discovery pilot is merged                       |
| Product E2E                     | centralized under `tests/e2e`                                                                                |

During migration, conceptual ownership and physical execution location may temporarily differ for browser/visual specs. The owner still determines the contract and impact relation. `docs/testing/migration-plan.md` is the source of truth for when a target location becomes executable.

Never describe target colocated Playwright discovery as implemented before the corresponding migration phase is merged.

## Proof decision

| Contract                                                                                                                            | Primary proof owner                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, non-browser wiring               | colocated `*.test.ts`                                 |
| Isolated supported rendering state                                                                                                  | colocated `*.stories.ts`                              |
| Real focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive rendering, motion lifecycle, browser APIs      | Storybook browser behavior spec owned by the UI owner |
| Bounded accepted appearance                                                                                                         | visual spec against a canonical story tagged `visual` |
| Complete scenario crossing FSD, service, worker, persistence, navigation, provider, permission, reload, or app bootstrap boundaries | `tests/e2e/*.spec.ts`                                 |

One observable contract has one primary proof owner. Higher-level proof may cover an integration seam or complete user outcome, but must not duplicate the full lower-level contract.

## How to author Storybook UI

For each changed UI owner:

1. identify the truthful component, local module, or Material family owner;
2. decide whether an isolated story has documentation, fixture, or visual value;
3. create only deterministic initial state through the public UI contract;
4. choose the lowest faithful proof type from `docs/testing/architecture.md`;
5. keep the story title in the deterministic catalogue hierarchy;
6. keep browser and visual assertions outside the story;
7. use the current executable spec location from the migration state;
8. update persistent impact metadata only when the current verifier requires a non-local or transitional relation;
9. run verifier-managed focused proof, then the task-level final gate.

Do not create stories mechanically for every `.vue` file.

## Stories

A story declares a deterministic initial rendering state. It may use owner-local fixture state required to operate the public UI contract.

Use only these roles:

- **catalog story** — supported state/configuration for development and documentation;
- **visual story** — canonical bounded state tagged `visual` and referenced by visual proof;
- **browser fixture** — deterministic initial state used by browser proof.

A story must not:

- contain assertions;
- perform the behavior under test;
- use `play` as merge proof;
- connect product stores, persistence, services, workers, diagnostics, accounts, network state, or application bootstrap;
- reproduce business rules;
- change production APIs for test convenience.

A browser fixture prepares state only. The browser spec performs real public input and assertions.

## Browser proof

Use browser proof only when real browser semantics cannot be faithfully modeled by Vitest.

Browser specs:

- use real public input;
- contain no screenshots;
- assert owner-specific browser outcomes only;
- do not expand into complete product scenarios;
- use a deterministic story or owner-local fixture as the initial surface;
- fail when required preconditions or outcomes are absent.

A family/module-level browser spec is allowed only when one shared observable contract truthfully belongs to that family/module. Otherwise split by owner.

## Visual proof

Use explicit visual specs. A small repeated open–stabilize–screenshot sequence is preferable to a generated runner that hides story selection and baseline ownership.

Visual specs:

- open named canonical stories;
- stabilize rendering through mechanical helpers only;
- capture bounded screenshots;
- contain no click, keyboard, pointer, focus, navigation, semantic, token-table, or geometry success criteria;
- own snapshots through the documented snapshot convention.

Do not snapshot every story or Cartesian combinations of props.

A baseline detects change. It does not prove Material correctness, accessibility, interaction, or motion lifecycle.

## Owner naming and impact relations

The target local relation uses one owner stem when truthful:

```text
MDLoadingIndicator.vue
MDLoadingIndicator.stories.ts
MDLoadingIndicator.browser.spec.ts
MDLoadingIndicator.visual.spec.ts
```

A Material family or cohesive module may use a distinct owner stem when the family/module itself owns the contract:

```text
ButtonFamily.browser.spec.ts
OverlayFoundation.browser.spec.ts
ReorderSurface.visual.spec.ts
```

Relations are resolved in this order:

1. direct spec ownership;
2. deterministic local owner convention when the lane supports it;
3. one explicit mapping for a truthful non-sibling family/module/cross-file relation;
4. full owning-lane fallback for unresolved relevant impact.

Agents must not infer non-local ownership from prose, Storybook titles, or directory similarity.

Do not use spec paths as source prefixes merely to group tests.

## Snapshot convention

The target colocated visual convention is:

```text
<Owner>.visual.spec.ts
<Owner>.visual.spec.ts-snapshots/
```

The visual resolver must handle added, modified, deleted, and renamed specs/baselines. If ownership cannot be determined exactly, select the full visual lane.

Story titles and export names are part of the visual-test address. Rename them only together with the owning visual spec and affected baselines.

Until the visual-discovery migration is complete, preserve the repository's current executable baseline convention.

## Storybook catalogue

File placement follows code ownership. Titles follow deterministic namespaces.

Material:

```text
Material 3/Components/<Family>/<Component>
Material 3/Patterns/<Pattern>
```

Other UI:

```text
Shared/<Slice>/<Owner>
Entities/<Slice>/<Owner>
Features/<Slice>/<Owner>
Widgets/<Slice>/<Owner>
Pages/<Slice>/<Owner>
```

Do not introduce `Project UI` or another arbitrary top-level namespace. A title may omit redundant path segments, but must not hide or contradict the owning FSD layer, slice, or Material family.

Catalogue normalization is a separate migration because title changes can change story IDs, URLs, and baselines. Existing non-conforming titles remain migration debt until that stage; do not rename them opportunistically in unrelated PRs.

## TypeScript and Playwright boundaries

Production application type-checking must not treat Storybook stories or Playwright specs as application runtime source.

When colocated Playwright discovery is introduced, dedicated Storybook/Playwright configuration must include those files while production TypeScript configuration excludes them.

Do not create a mirrored central component-spec tree as permanent ownership metadata.

## Shared helpers

Keep setup local by default. Extract a shared helper only after unrelated owners need the same mechanical operation and extraction reduces total complexity.

Shared helpers may open a named story, wait for deterministic fonts/rendering, select a bounded surface, or provide strict semantic actions. They must not select tests, decide component behavior, silently recover from missing state, or create a Storybook-specific DSL.

## Forbidden

- treating Storybook as an FSD layer or product runtime;
- central component-spec trees as permanent ownership mirrors;
- colocated Playwright specs before the owning lane can discover them;
- assertions or interaction scripts in stories;
- Storybook `play` as a parallel merge-proof system;
- screenshots in browser-behavior specs;
- browser behavior, computed token matrices, or geometry assertions in visual specs;
- product stores, workers, persistence, network, or app bootstrap in stories;
- test-only exports from production barrels;
- a generic Storybook registry/DSL/generated runner without demonstrated repeated need and an architecture decision;
- arbitrary per-story taxonomy;
- opportunistic story-title normalization before the dedicated catalogue migration;
- moving product behavior into Storybook fixtures;
- duplicating Material workflow policy here.

## Migration sequence

Migrate through independently safe PRs:

1. architecture and repository rules;
2. colocated Storybook browser discovery pilot using Loading Indicator;
3. remaining Storybook browser-spec migration;
4. colocated visual discovery and snapshot-ownership pilot;
5. remaining visual-spec/baseline migration;
6. proof-ownership cleanup after resolver stability;
7. Storybook catalogue normalization.

Every intermediate PR must preserve valid commands, current regression protection, safe full fallback, and deterministic add/modify/delete/rename handling before removing legacy execution paths.
