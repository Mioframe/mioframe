# Storybook architecture

This document defines Storybook ownership, developer-workbench behavior, file placement, and authoring rules for Mioframe. `docs/testing/architecture.md` remains the canonical project-wide policy for proof types and execution lanes. `docs/testing/migration-plan.md` records which parts of this target are already executable in the repository.

## Goal

Make Storybook a predictable interactive UI workbench and proof surface:

- the owner is obvious from the repository path;
- reusable UI can be found through a stable catalogue and URL;
- configurable public inputs can be explored through Controls;
- visual appearance can be inspected in a consistent sandbox with useful viewport/background tools;
- routing-aware UI can run against an isolated real `vue-router` memory history without bootstrapping the product application;
- stories and owner-specific proof stay next to the truthful owner;
- product scenarios remain separate from reusable UI proof;
- impact selection is deterministic and fail closed;
- no agent invents a parallel Storybook structure, registry, control system, router, or test system.

## Storybook role

Storybook is the interactive isolated UI workbench for Mioframe. It provides:

- a navigable catalogue of reusable UI owners and supported states;
- a Playground surface for live public-API exploration through args and Controls;
- deterministic browser fixtures;
- a viewport/background/layout sandbox for manual appearance inspection;
- visual-regression inputs;
- an isolated routing context for routing-aware reusable UI.

Storybook is not an FSD layer, product runtime, state-management layer, service boundary, or product-scenario owner.

Stories prepare deterministic state. Controls modify public inputs. Tests perform assertions and merge-proof interaction.

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

The durable target is being migrated incrementally. Do not place a test where current Playwright discovery cannot execute it.

| Capability | Current state |
| --- | --- |
| Story discovery | colocated `src/**/*.stories.*` is already supported |
| Controls | Storybook Essentials controls are available; Vue metadata drives automatic controls |
| Viewport/background sandbox | global desktop/mobile viewports and app/surface backgrounds are already configured |
| Vue router context | one global memory router exists, but only a minimal `/` route is available; the reusable per-story routing harness is still migration work |
| Vue component contract | colocated `*.test.ts` |
| Storybook browser behavior spec | keep the current executable location under `tests/e2e/storybook` until the browser-discovery pilot is merged |
| Visual spec and baseline | keep the current executable visual location until the visual-discovery pilot is merged |
| Product E2E | centralized under `tests/e2e` |

During migration, conceptual ownership and physical execution location may temporarily differ for browser/visual specs. The owner still determines the contract and impact relation. `docs/testing/migration-plan.md` is the source of truth for when a target location or workbench capability becomes executable.

Never describe target colocated Playwright discovery or the target routing harness as implemented before the corresponding migration stage is merged.

## Developer workbench contract

A reusable public component or Material family with meaningful configurable inputs should provide one primary **Playground** story unless its public surface is genuinely trivial or another existing story already provides the same exploration value.

The Playground is for interactive inspection, not proof. It should make it easy to answer:

- what public inputs does this component support;
- what does each supported option look like;
- how does it respond at useful viewport sizes and backgrounds;
- how does routing-aware UI behave in an isolated route context;
- what URL can another developer open to reproduce the same selected story and serializable args.

Do not create a second component API exclusively for Storybook.

### Args and Controls

Use Storybook `args` as the source for interactive public inputs. Let Vue component metadata generate controls by default and add `argTypes` only when needed to improve a public control's type, options, label, documentation, or serializable mapping.

Controls must represent the real public component API:

- expose meaningful public props that a developer may reasonably vary;
- use select/radio controls for bounded public unions/enums;
- use boolean, number, text, color, and date controls when they truthfully match the public type;
- expose emitted public actions through Storybook Actions when useful for manual inspection;
- use a small story-local mapping when a serializable control value must select a public slot/example value;
- use dedicated stories for complex slot compositions that are not honestly representable as args.

Do not:

- expose private renderer inputs, internal refs, private CSS variables, implementation state, or test-only switches as Controls;
- manually duplicate every prop definition in `argTypes` when docgen already expresses it correctly;
- add a production prop solely because Storybook Controls cannot represent a slot or complex value;
- use Controls state as automated proof.

Serializable args are allowed to participate in Storybook's URL state. Keep control values stable enough that a copied Storybook URL is useful for reproducing the same interactive configuration.

## Visual inspection sandbox

Manual appearance review is a first-class Storybook use case distinct from visual-regression assertions.

The global sandbox should provide the smallest useful set of controls for inspecting UI:

- viewport selection for representative desktop and mobile sizes;
- background/surface selection;
- Storybook's built-in measure/outline tools;
- per-story `centered`, `padded`, or `fullscreen` layout selected according to the real surface being inspected;
- the same project styles, fonts/icons, and public Material theme/token sources used by the application.

A component Playground should remain freely adjustable. A canonical visual-regression story may pin viewport/background/layout when determinism requires it.

Do not duplicate application or Material theme token values in Storybook-specific CSS merely to build a theme switcher. If an explicit light/dark/system toolbar is added, it must drive the same theme source of truth used by production or another deterministic non-duplicating mechanism approved by the relevant theme owner.

Visual inspection is exploratory. Accepted screenshot baselines remain owned by explicit visual specs.

## Routing and navigation

There are two separate routing concerns.

### Storybook catalogue navigation

Storybook's own manager/sidebar is the normal navigation surface between UI owners and stories. Story titles follow the deterministic catalogue hierarchy defined below. Story URLs are stable addresses used by developers and tests; title/export renames therefore require deliberate migration.

Do not build a second custom component catalogue or navigation shell inside stories.

### Vue Router inside stories

Routing-aware reusable UI must use a **Storybook-owned router harness** based on Vue Router memory history. It must exercise the real public Vue Router API while remaining isolated from product routing.

The target harness must support only reusable routing needs:

- a deterministic initial location;
- path, query, hash, and route params through explicit minimal story-owned route records;
- `RouterLink`, `useRoute`, and `useRouter` behavior;
- `push`, `replace`, back, and forward navigation where the UI contract requires them;
- reset/isolation when switching stories so route state cannot leak between stories.

A story supplies only the minimum route records/current location required by its UI contract. Shared Storybook infrastructure may own the mechanical memory-router setup and reset behavior.

Do not import the production app router, production guards, authentication, stores, service initialization, persistence, network setup, or product route orchestration into Storybook.

If the behavior being inspected is the application's actual route graph, navigation workflow, permission redirect, persistence/reload route behavior, or another cross-owner product scenario, it belongs to application E2E rather than the Storybook router harness.

## Proof decision

| Contract | Primary proof owner |
| --- | --- |
| Props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled semantic state, non-browser wiring | colocated `*.test.ts` |
| Interactive public-API exploration | Playground story with Controls; not merge proof |
| Isolated supported rendering state | colocated `*.stories.ts` |
| Real focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive rendering, reusable routing, motion lifecycle, browser APIs | Storybook browser behavior spec owned by the UI owner |
| Bounded accepted appearance | visual spec against a canonical story tagged `visual` |
| Complete scenario crossing FSD, service, worker, persistence, navigation, provider, permission, reload, app router, or bootstrap boundaries | `tests/e2e/*.spec.ts` |

One observable contract has one primary proof owner. Higher-level proof may cover an integration seam or complete user outcome, but must not duplicate the full lower-level contract.

## How to author Storybook UI

For each changed UI owner:

1. identify the truthful component, local module, or Material family owner;
2. decide whether an isolated story has Playground, documentation, fixture, or visual value;
3. for configurable public UI, prefer one args-driven Playground instead of many stories that differ only by one controllable prop;
4. add dedicated named stories only for materially distinct compositions/states that improve documentation, browser fixtures, or canonical visual proof;
5. create only deterministic initial state through the public UI contract;
6. configure the minimum route fixture when routing context is required;
7. choose the lowest faithful proof type from `docs/testing/architecture.md`;
8. keep the story title in the deterministic catalogue hierarchy;
9. keep browser and visual assertions outside the story;
10. use the current executable spec location from the migration state;
11. update persistent impact metadata only when the current verifier requires a non-local or transitional relation;
12. run verifier-managed focused proof, then the task-level final gate.

Do not create stories mechanically for every `.vue` file.

## Stories

A story declares a deterministic initial rendering state. It may use owner-local fixture state required to operate the public UI contract.

Use only these roles:

- **Playground story** — interactive public API through args/Controls;
- **catalog story** — materially distinct supported state/composition useful for development/documentation;
- **visual story** — canonical bounded state tagged `visual` and referenced by visual proof;
- **browser fixture** — deterministic initial state used by browser proof.

One story may serve more than one role when the responsibilities do not conflict. Do not duplicate stories solely to attach a role label.

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

Use explicit visual specs. A small repeated open-stabilize-screenshot sequence is preferable to a generated runner that hides story selection and baseline ownership.

Visual specs:

- open named canonical stories;
- stabilize rendering through mechanical helpers only;
- capture bounded screenshots;
- contain no click, keyboard, pointer, focus, navigation, semantic, token-table, or geometry success criteria;
- own snapshots through the documented snapshot convention.

Do not snapshot every Playground configuration, story, or Cartesian combination of props.

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

## Shared Storybook infrastructure

Storybook-wide infrastructure is valid when the need is genuinely cross-owner and mechanical. Current justified examples are:

- global project styles and deterministic icon/font setup;
- viewport/background configuration;
- automatic Vue docgen/Controls support;
- the Storybook-owned memory-router harness;
- strict mechanical helpers for opening/stabilizing stories in Playwright.

Keep owner-specific setup local by default. Extract shared infrastructure only when unrelated owners need the same mechanism and extraction reduces total complexity.

Shared infrastructure must not select product behavior, silently recover from missing state, duplicate production architecture, or become a Storybook-specific DSL.

## Forbidden

- treating Storybook as an FSD layer or product runtime;
- central component-spec trees as permanent ownership mirrors;
- a custom catalogue/navigation shell that duplicates Storybook manager navigation;
- colocated Playwright specs before the owning lane can discover them;
- assertions or behavior-under-test scripts in stories;
- Storybook `play` as a parallel merge-proof system;
- screenshots in browser-behavior specs;
- browser behavior, computed token matrices, or geometry assertions in visual specs;
- product stores, workers, persistence, network, production router/bootstrap, or business rules in stories;
- Storybook-only production props or private renderer Controls;
- duplicated manual `argTypes` mirrors of an already-correct public Vue API;
- Storybook-specific copies of production theme token values;
- test-only exports from production barrels;
- a generic Storybook registry/DSL/generated runner without demonstrated repeated need and an architecture decision;
- arbitrary per-story taxonomy;
- opportunistic story-title normalization before the dedicated catalogue migration;
- moving product behavior into Storybook fixtures;
- duplicating Material workflow policy here.

## Migration sequence

Migrate through independently safe PRs:

1. architecture and repository rules;
2. Storybook workbench foundation: complete the reusable memory-router harness and prove Playground/Controls/viewport/background behavior without changing production APIs;
3. colocated Storybook browser discovery pilot using Loading Indicator;
4. remaining Storybook browser-spec migration;
5. colocated visual discovery and snapshot-ownership pilot;
6. remaining visual-spec/baseline migration;
7. proof-ownership cleanup after resolver stability;
8. Storybook catalogue normalization.

Every intermediate PR must preserve valid commands, current regression protection, safe full fallback, and deterministic add/modify/delete/rename handling before removing legacy execution paths.
