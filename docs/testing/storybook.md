# Storybook architecture

This document defines Storybook ownership, developer-workbench behavior, story authoring, fixture isolation, catalogue conventions, and visual sandbox rules for Mioframe.

`docs/testing/architecture.md` is canonical for project-wide verification types, test-spec suffixes, affected ownership, E2E ownership, and fallback. `docs/testing/migration-plan.md` records current executable legacy suffix/location compatibility during migration.

## Goal

Storybook is Mioframe's predictable isolated UI workbench and fixture surface:

- the UI owner is obvious from repository placement;
- reusable UI can be found through a stable catalogue and URL;
- public inputs can be explored through Controls;
- controlled public state stays synchronized between component interaction and Controls;
- viewport/background/layout/theme can be inspected without product bootstrap;
- routing-aware reusable UI can use an isolated real `vue-router` memory history;
- selected public reusable UI can expose generated documentation without a second handwritten API catalogue;
- stories provide deterministic fixtures for behavior and visual proof;
- product scenarios remain outside Storybook;
- agents do not invent parallel registries, routers, theme copies, or test DSLs.

## Role

Storybook is not an FSD layer, product runtime, state-management layer, service boundary, or product-scenario owner.

It provides:

- a catalogue of reusable UI owners/states;
- Playground/Controls for public API exploration;
- deterministic browser fixtures;
- a visual inspection sandbox;
- selective generated API documentation;
- canonical visual-regression inputs;
- isolated reusable routing context.

Stories prepare deterministic initial state. Controls modify public inputs. Automated tests own assertions and merge proof.

## Ownership and target placement

The truthful UI owner owns its stories and ordinary owner-specific behavior/visual proof.

### Material family

```text
src/shared/ui/material/components/<family>/
├── <Component>.vue
├── <Component>.test.ts
├── <Component>.stories.ts
├── <Family>.behavior.spec.ts      # optional target behavior proof
├── <Family>.visual.spec.ts        # optional target visual proof
└── local fixture files            # rare, optional
```

A family-level spec is valid only when the observable contract belongs to the family. Do not create one spec per Vue file mechanically.

Material workflow artifacts, renderer boundaries, public API, token ownership, and family proof selection remain governed by Material-specific repository rules and family architecture.

### Other FSD UI

Colocate with the existing truthful component or cohesive local UI module; do not restructure a module only to match an example tree.

Typical target:

```text
src/<layer>/<slice>/ui/
├── <Owner>.vue
├── <Owner>.test.ts
├── <Owner>.stories.ts
├── <Owner>.behavior.spec.ts       # optional target behavior proof
├── <Owner>.visual.spec.ts         # optional target visual proof
└── <Owner>BrowserFixture.vue      # rare, optional
```

### Product scenarios

Complete product scenarios are E2E, not Storybook proof.

Their target placement and ownership follow `docs/testing/architecture.md` under `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/` with `*.e2e.spec.ts`.

Storybook infrastructure proof may remain non-local only when it truthfully has no single UI owner. Do not use central Storybook proof as a permanent mirror for ordinary component ownership.

Stories, fixtures, specs, snapshots, and test helpers are never exported from production barrels.

## Current executable compatibility

The target naming above may differ from the current runner while the verify redesign is being implemented.

Current legacy behavior discovery may still execute `src/**/*.browser.spec.ts` and central `tests/e2e/storybook/**/*.spec.ts`. Current visual discovery may still combine owner-local `src/**/*.visual.spec.ts` with central legacy visual specs.

Those compatibility mechanisms are recorded only in `docs/testing/migration-plan.md`. They are not a second target architecture.

Do not rename/move a spec before target discovery is executable. Do not add new permanent proof in a legacy naming/location model once its target replacement is executable.

## Developer workbench contract

A reusable public component or Material family with meaningful configurable inputs should provide one primary **Playground** story unless the public surface is genuinely trivial or another story already provides equivalent exploration value.

The Playground should make it easy to inspect:

- supported public inputs;
- controlled state;
- direct interaction plus Controls synchronization;
- useful viewport sizes;
- semantic backgrounds/surfaces;
- `System`, `Light`, and `Dark` theme modes;
- reusable routing behavior when applicable;
- a stable URL for reproducing the story and serializable args.

The Playground is exploratory, not merge proof.

## Args and Controls

Use Storybook `args` for interactive public inputs. Let Vue metadata generate Controls by default and add `argTypes` only when needed to improve public typing/options/labels/docs/serializable mapping.

When a public controlled value changes through interaction (`modelValue`, `checked`, `selected`, or equivalent), round-trip the emitted public update back into Storybook args with the smallest story-local Storybook-supported mechanism.

Controls and the rendered component must remain synchronized after either direct interaction or a Controls change.

Do not:

- expose private renderer inputs, refs, private CSS variables, implementation state, or test-only switches;
- manually mirror every prop in `argTypes` when docgen is correct;
- add production props solely for Storybook;
- create a global Storybook state store to synchronize controlled args;
- treat Controls state as automated proof.

## Documentation and Autodocs

Autodocs is a convenience surface, not another source of truth.

Use it selectively for public Material adapters or reusable shared UI where generated component metadata is useful.

Generated docs must derive from real Vue public types, props, events, slots, TSDoc, args, and narrowly justified `argTypes`.

Do not maintain a second handwritten public API catalogue inside stories.

Feature/widget/page stories do not require Autodocs merely because they exist.

## Preview isolation and shared styling

Storybook Canvas must render reusable UI against the smallest faithful shared environment, not the application shell by accident.

It may consume production-owned low-level styling required for truthful component rendering:

- normalization/base browser styling;
- fonts/icons;
- Material foundation/theme/tokens;
- shared low-level style primitives actually required by the owner.

Do not import the full application shell merely to obtain those dependencies when it also adds product viewport/layout/scrolling/transition behavior.

Storybook-specific CSS owns fixture/sandbox presentation only. It must not recreate production component/theme styling.

## Theme and visual sandbox

The workbench should expose:

- representative desktop/mobile viewports;
- semantic backgrounds/surfaces;
- `System`, `Light`, and `Dark` theme modes;
- Storybook measure/outline tools;
- per-story `centered`, `padded`, or `fullscreen` layout where truthful.

`System` preserves the production system-following default. `Light` and `Dark` are deterministic inspection overrides through the production-owned Material/theme seam, not copied token sets.

Checkerboard/transparency backdrops are specialized fixtures only when transparency/container/elevation/state-layer visibility requires them; they are not the default Playground surface.

A canonical visual story may pin deterministic globals independently from the freely adjustable Playground.

Manual inspection is exploratory. Accepted screenshot baselines remain owned by visual specs.

## Routing inside stories

Routing-aware reusable UI uses a Storybook-owned Vue Router memory-history harness.

The harness may support only reusable routing needs:

- deterministic initial location;
- explicit minimal story-owned route records;
- path/query/hash/params;
- `RouterLink`, `useRoute`, and `useRouter`;
- push/replace/back/forward where required;
- reset/isolation between story remounts.

Do not import product router configuration, guards, auth, stores, services, persistence, network setup, or product bootstrap into Storybook.

If the contract is the application's actual route graph or a complete navigation/permission/persistence flow, it belongs to E2E.

## Proof decision

| Contract | Primary proof |
| --- | --- |
| props/emits/slots/native owner/ARIA ownership/controlled semantic state/non-browser wiring | colocated unit/component contract `*.test.ts` |
| interactive public API exploration | Playground story; not merge proof |
| isolated supported rendering state | colocated `*.stories.ts` |
| focus/keyboard/pointer/drag/geometry/scrolling/overlays/responsive interaction/reusable routing/public motion | owner-local `*.behavior.spec.ts` |
| bounded accepted appearance | owner-local `*.visual.spec.ts` against canonical story |
| complete product scenario | E2E per `docs/testing/architecture.md` |

One observable contract has one primary proof owner. Higher-level proof may protect integration, but must not duplicate the complete lower-level contract.

## Story roles

Use only these roles:

- **Playground** — interactive public API through args/Controls;
- **catalog story** — materially distinct supported state/composition;
- **visual story** — canonical bounded state tagged `visual` and referenced by visual proof;
- **browser fixture** — deterministic initial state used by behavior proof.

One story may serve several roles when responsibilities do not conflict.

A story must not:

- contain merge-proof assertions;
- perform the behavior under test;
- use `play` as a parallel verification system;
- connect product stores, persistence, services, workers, diagnostics, accounts, network state, or product bootstrap;
- reproduce business rules;
- change production APIs for test convenience.

## Behavior proof

Use behavior proof only when real browser semantics cannot be faithfully modeled by unit/component tests.

Behavior specs:

- use real public input;
- contain no screenshots;
- assert owner-specific browser outcomes;
- do not expand into complete product scenarios;
- use deterministic stories/fixtures for initial state;
- fail when required preconditions/outcomes are absent.

Target naming is `*.behavior.spec.ts` beside the truthful owner.

During migration, legacy `*.browser.spec.ts` remains executable only where the migration plan says so.

A non-local fixture dependency must be truthful. Prefer the smallest owner-local fixture when the scenario actually belongs to the local owner.

## Visual proof

Visual specs:

- open named canonical stories;
- stabilize rendering through mechanical helpers only;
- capture bounded screenshots;
- contain no click/keyboard/pointer/focus/navigation/semantic/token-table/geometry success criteria;
- own snapshots through deterministic local ownership.

Target baseline convention:

```text
<Owner>.visual.spec.ts
<Owner>.visual.spec.ts-snapshots/
```

A baseline detects change. It does not prove Material correctness, accessibility, behavior, or motion lifecycle.

## Catalogue

Target top-level order:

1. `Material 3`;
2. `Shared`;
3. `Entities`;
4. `Features`;
5. `Widgets`;
6. `Pages`.

Target namespaces:

```text
Material 3/Components/<Family>/<Component>
Material 3/Patterns/<Pattern>
Shared/<Slice>/<Owner>
Entities/<Slice>/<Owner>
Features/<Slice>/<Owner>
Widgets/<Slice>/<Owner>
Pages/<Slice>/<Owner>
```

Use Storybook's native manager/sidebar and sorting. Do not build another catalogue/navigation shell.

Title/export renames can change story IDs, URLs, and visual baselines; migrate them deliberately rather than opportunistically.

## TypeScript and runner boundaries

Application/runtime type-checking and Vitest must not accidentally classify Playwright specs as production/unit inputs.

The target exclusions/discovery must account for:

- `*.behavior.spec.ts`;
- `*.visual.spec.ts`;
- `*.browser-integration.spec.ts`;
- `*.performance.spec.ts` where executed outside unit tooling.

During migration, preserve exclusions/discovery for any still-executable legacy `*.browser.spec.ts` files until they are renamed.

Do not create a mirrored central component-spec tree as permanent ownership metadata.

## Storybook build verification

Changed Storybook configuration/stories must remain buildable even when no behavior/visual spec is selected.

The verifier owns the Storybook build as an internal prerequisite/check; it is not a separate public verification type.

Reuse an equivalent deterministic Storybook static build inside one verify run when doing so removes duplicate compilation without merging proof ownership or hiding failures.

A successful Storybook build proves configuration/module integrity only. It does not replace unit, behavior, visual, browser-integration, or E2E proof.

## Shared Storybook infrastructure

Shared Storybook infrastructure is valid only for genuinely cross-owner mechanical needs, such as:

- preview style composition;
- font/icon setup;
- viewport/background/layout configuration;
- theme-mode toolbar adapter;
- Vue docgen/Controls support;
- deterministic native sorting;
- memory-router harness;
- strict mechanical story-opening/stabilization helpers.

Keep owner-specific setup local by default. Extract shared infrastructure only when several unrelated owners need the same mechanism and total complexity decreases.

Shared infrastructure must not select product behavior, silently recover missing state, duplicate production architecture, or become a Storybook DSL.

## Forbidden

- treating Storybook as an FSD layer or product runtime;
- central component-spec trees as permanent ownership mirrors;
- a custom catalogue/navigation shell;
- full product bootstrap inside Storybook;
- assertions/behavior-under-test scripts in stories;
- Storybook `play` as merge proof;
- screenshots in behavior specs;
- behavior/token matrices/geometry success criteria in visual specs;
- product stores/workers/persistence/network/product router/business rules in stories;
- Storybook-only production props or private renderer Controls;
- a global Storybook state store for args;
- Storybook copies of production theme tokens;
- mandatory Autodocs for every story;
- test-only exports from production barrels;
- generic Storybook registry/DSL/generated runner without demonstrated need;
- moving complete product behavior into Storybook fixtures;
- adding new legacy `*.browser.spec.ts` proof after target behavior discovery is available;
- duplicating Material workflow policy here.
