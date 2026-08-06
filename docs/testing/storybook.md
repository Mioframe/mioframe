# Storybook architecture

This document defines the durable Storybook ownership and file-placement rules for Mioframe. `docs/testing/architecture.md` remains the canonical project-wide policy for proof types and execution lanes.

## Goal

Make isolated UI documentation and browser/visual proof mechanical for coding agents:

- the current UI owner is obvious from the repository path;
- stories and owner-specific proof are found next to that owner;
- product scenarios remain separate from reusable UI proof;
- verification impact is deterministic and fail closed;
- no agent invents a parallel Storybook structure, registry, or test system.

## Storybook role

Storybook is not an FSD layer and does not own product behavior. It is the isolated rendering surface for:

- documented supported UI states;
- deterministic browser fixtures;
- visual-regression inputs.

Stories prepare state. Tests perform assertions.

Storybook must not become a second application runtime, service boundary, state-management layer, or product-scenario owner.

## Ownership model

The current UI owner owns its stories and owner-specific browser and visual proof.

### Material library

For `src/shared/ui/material`, the Material family is the owner:

```text
src/shared/ui/material/components/<family>/
├── <Component>.vue
├── <Component>.test.ts
├── <Component>.stories.ts
├── <Family>.browser.spec.ts       # optional
├── <Family>.visual.spec.ts        # optional
└── local fixture files            # rare, optional
```

A family-level spec is valid when the observable contract belongs to the family. Do not create one spec per Vue file mechanically.

Material family ownership, workflow artifacts, renderer boundaries, and proof selection remain governed by `src/shared/ui/material/AGENTS.md`, `src/shared/ui/material/docs/architecture.md`, and the family `ARCHITECTURE.md`.

### Other FSD UI

For UI outside the canonical Material library, the current FSD component or cohesive local UI module is the owner:

```text
src/<layer>/<slice>/ui/
├── <Owner>.vue
├── <Owner>.test.ts
├── <Owner>.stories.ts
├── <Owner>.browser.spec.ts        # optional
├── <Owner>.visual.spec.ts         # optional
└── <Owner>BrowserFixture.vue      # rare, optional
```

Do not restructure a module only to produce this exact directory shape. Colocate files with the existing truthful owner.

### Product scenarios

Complete scenarios crossing several owners remain centralized under `tests/e2e`.

Storybook infrastructure smoke may remain centralized because it has no component, family, or FSD owner.

Do not export stories, fixtures, test helpers, specs, or snapshots through production barrels.

## Proof decision table

| Changed contract | Primary proof owner |
| --- | --- |
| Props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, and non-browser wiring | colocated `*.test.ts` |
| Isolated supported rendering state | colocated `*.stories.ts` |
| Real focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive rendering, motion lifecycle, or browser APIs | colocated `*.browser.spec.ts` |
| Bounded accepted appearance | colocated `*.visual.spec.ts` against a story tagged `visual` |
| Complete scenario crossing FSD, service, worker, persistence, navigation, provider, permission, reload, or application bootstrap boundaries | `tests/e2e/*.spec.ts` |

One observable contract has one primary proof owner. A higher-level test may prove a narrow integration seam or complete product outcome, but must not repeat the complete lower-level contract.

## Stories

A story declares one deterministic initial rendering state. It may use local fixture state required to operate the public UI contract.

A story must not:

- contain assertions;
- perform the behavior under test;
- use `play` as merge proof;
- connect product stores, persistence, services, workers, diagnostics, accounts, network state, or application bootstrap;
- reproduce business rules;
- change production public APIs for test convenience.

Create a story only when the owner has a meaningful isolated state, reusable public contract, browser-fixture need, documentation value, or visual-review value.

Use these roles only:

- **catalog story** — supported state or configuration for development and documentation;
- **visual story** — canonical bounded state tagged `visual` and referenced by a visual spec;
- **browser fixture** — deterministic initial state used by a browser spec.

A browser fixture prepares state only. The browser spec performs real public input and assertions.

## Browser proof

Use `*.browser.spec.ts` only when a real browser owns semantics that Vitest cannot faithfully model.

Browser specs:

- use real public input;
- contain no screenshots;
- assert owner-specific browser outcomes only;
- do not expand into complete product scenarios;
- use a sibling story or local fixture as the initial surface;
- fail when required preconditions or outcomes are absent.

A family-level or module-level browser spec is allowed only when one shared observable contract truthfully belongs to that family or module. Otherwise split it by owner.

## Visual proof

Use explicit colocated `*.visual.spec.ts` files. A small repeated open–stabilize–screenshot sequence is preferable to a generic runner that hides story selection and baseline ownership.

Visual specs:

- open named canonical stories;
- stabilize rendering through shared mechanical helpers;
- capture bounded screenshots;
- contain no click, keyboard, pointer, focus, navigation, semantic, token-table, or geometry success criteria;
- own snapshots through the repository snapshot convention.

Do not snapshot every story or every Cartesian combination of props.

## Owner naming and local discovery

The normal local relation uses one owner stem:

```text
MDLoadingIndicator.vue
MDLoadingIndicator.stories.ts
MDLoadingIndicator.browser.spec.ts
MDLoadingIndicator.visual.spec.ts
```

For a Material family or cohesive module, the approved family/module owner may use a distinct truthful stem:

```text
ButtonFamily.browser.spec.ts
OverlayFoundation.browser.spec.ts
ReorderSurface.visual.spec.ts
```

A non-sibling or differently named relation must be represented by one explicit repository mapping. Agents must not infer such ownership from prose, titles, or directory similarity.

Local discovery rules must be deterministic:

1. a changed colocated spec selects itself;
2. a changed production owner, sibling story, or local fixture selects existing matching owner specs;
3. explicitly mapped family, module, and cross-file sources select the mapped specs;
4. deleted or renamed specs, unresolved ownership, or stale metadata select the full owning lane or fail validation;
5. an unmapped relevant path never silently skips proof.

Do not use spec paths as source prefixes merely to group tests.

## Snapshot convention

The target visual snapshot convention is:

```text
<Owner>.visual.spec.ts
<Owner>.visual.spec.ts-snapshots/
```

The visual resolver must handle added, modified, deleted, and renamed specs and baselines. If ownership cannot be determined exactly, it selects the full visual lane.

Story titles and export names are part of the visual-test address. Renaming them requires updating the owning spec and affected baselines in the same change.

## Storybook catalogue

File placement follows code ownership. Storybook titles use deterministic discovery-oriented namespaces.

Material library:

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

Do not introduce `Project UI` or arbitrary top-level namespaces. A title may omit redundant path segments, but must not hide or contradict the owning FSD layer, slice, or Material family.

Catalogue normalization is separate from test-file migration because changing titles can change story IDs, URLs, and baselines.

## TypeScript and Playwright boundaries

Production application type-checking must exclude Storybook stories and colocated Playwright specs.

Storybook and Playwright checks must include their own files through dedicated configuration. Playwright discovery must explicitly include colocated `*.browser.spec.ts` or `*.visual.spec.ts` files plus the small central infrastructure specs.

Do not rely on a mirrored central test directory as ownership metadata.

## Shared helpers

Keep setup local by default. Add a shared helper only after unrelated owners need the same mechanical operation and extraction reduces total complexity.

Shared helpers may:

- open a named story;
- wait for deterministic rendering and fonts;
- select a bounded surface;
- provide strict semantic actions.

They must not select tests, decide component behavior, hide missing state, retry behavior until it passes, or create a Storybook-specific test DSL.

## Forbidden

- central component-spec trees that mirror `src`;
- component or family browser/visual specs separated from their owner without a concrete cross-owner reason;
- assertions or interaction scripts in stories;
- screenshots in browser-behavior specs;
- browser behavior, computed token matrices, or geometry assertions in visual specs;
- Storybook `play` functions as a parallel merge-proof system;
- production runtime dependencies in stories;
- test-only exports from production barrels;
- a generic Storybook test DSL, registry, or generated runner without repeated demonstrated need and an architecture decision;
- a taxonomy chosen independently for each story;
- moving application behavior into Storybook fixtures;
- duplicating Material family workflow policy in this document.

## Migration sequence

Migrate through independently safe PRs:

1. this architecture contract and repository rules;
2. colocated browser discovery pilot using one narrow owner;
3. remaining Storybook browser-spec migration;
4. colocated visual discovery and snapshot-ownership pilot;
5. remaining visual-spec and baseline migration;
6. proof-ownership cleanup after resolver stability;
7. Storybook catalogue normalization.

Use Loading Indicator as the preferred first Material browser-discovery pilot because it has one narrow family owner and lower mixed-suite risk than Button.

Every intermediate PR must preserve valid commands, current regression protection, safe broad fallback, and deterministic handling of add, modify, delete, and rename operations.