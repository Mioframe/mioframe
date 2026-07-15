---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. Enforces the Material library boundary, source-backed usage, accepted foundation dependencies, minimum component profiles, explicit DOM ownership, native semantics, the standard component test profile, and focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Shared UI implementation

Use for `src/shared/ui` work.

Public Material components also follow:

- `material3-guidelines`;
- `component-contract-testing`;
- `ui-browser-behavior` when browser-owned behavior exists;
- `visual-regression-testing`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/foundation-architecture.md`.

## Library routing

`src/shared/ui/material` is the canonical Material library root.

- Create new official public `MD*` components only under `material/components/<family>`.
- Create new Material foundation runtime artifacts only under `material/foundation/<domain>`.
- Create Material patterns only under `material/patterns/<pattern>` after the documented pattern gate passes.
- Keep generic infrastructure and project-specific shared UI outside the Material library.
- Treat existing Material directories outside the root as legacy, not as templates.

A strict local repair may stay at a legacy path only when it preserves location, public API, foundation contracts, testing surface, behavior, and unrelated output. New Material surface at a legacy path is forbidden.

## Before production edits

Record `standard-authoring`, `handoff-authoring`, or `blocked`.

For `standard-authoring`:

1. read scoped rules, the library map, current family README, and applicable foundation-registry records;
2. inspect named consumers and the nearest relevant shared integration pattern;
3. read only relevant official component/foundation pages;
4. derive the minimum supported surface and Material usage contract;
5. declare foundation dependencies and any foundation delta;
6. resolve canonical library location, public export, and consumer migration;
7. write the ready family blueprint, including the standard test profile and state-matrix coverage;
8. select the smallest component profile;
9. identify contract, browser, visual, pure-behavior, and consumer verification before production edits.

Use `blocked` rather than inventing behavior, ownership, public extensions, generic infrastructure, local foundation substitutes, migration compatibility, or test-only production APIs.

## Component structure

Inside `material/components/<family>`, use exactly one profile from `component-architecture.md`:

- `simple`;
- `configured`;
- `stateful`;
- `configured-stateful`.

Add token, route, state, family anatomy, behavior, composable, or context files only under their documented objective conditions. Empty or convenience-only layers are forbidden.

Each family owns its README, family `index.ts`, production files, stories, colocated contract tests, and focused browser/visual verification. The root Material barrel is curated and must not be imported internally by library modules.

## Usage and ownership

The family blueprint records intended/prohibited usage, composition, placement, adaptivity, product integration, canonical path, current legacy path when applicable, migration mode, test profile, and state-matrix coverage.

Components own public API, native semantics, anatomy, component behavior, tokens, property routing, rendering, and component-specific verification. Product layers own information architecture, component choice, placement, workflow, and adaptive composition.

Do not add product-specific behavior to a shared primitive for one consumer. Do not move a project-specific wrapper into `material/components` merely to centralize files.

## Foundation dependencies

Consume the owners named by `foundation-registry.md` and the physical owners recorded in the Material library map.

Do not recreate theme, units, typography, shape, elevation, motion, state/ripple/focus, icons, density, accessibility, overlay, or adaptive behavior locally.

Generic foundation bridges remain component-agnostic. Component families map final values into those bridges.

Verification-only transient-state adapters belong to the owning foundation testing surface. Do not add family-local forced-state systems or public props/classes solely for Storybook.

A foundation additive delta may share the component PR only under the strict conditions in `foundation-architecture.md`. Corrections and replacements require consumer-impact review and normally a focused PR.

## Vue and DOM

- Keep typed props, emits, slots, small named computeds, runtime fact acquisition, native bindings, events, and anatomy in Vue.
- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit on the native owner.
- Prefer native activation and form behavior.
- Use controlled fallthrough attrs only when necessary.
- Avoid inline boolean algebra, topology objects, render plans, and broad options objects.
- Vue acquires runtime facts; CSS resolves visual values.

## Styling

- Token files own exact official component-token defaults only.
- Route files own configuration selection only.
- State files own property-specific semantic/interaction resolution and state-varying foundation bridges.
- Rendering files apply final values to actual DOM owners.
- Static values use canonical sources directly; configured non-stateful values may use routes directly.
- Rendered private variables exist only for state-resolved output or stable generic bridge input.
- Do not use one state precedence for all properties, `:deep()` into another component, or family-private contracts outside the family.

## Public API and imports

- Product consumers use `@shared/ui/material` after the root production entry point exists.
- Internal library code imports accepted foundation or family entry points, not the root barrel.
- External deep imports into `.vue`, `.css`, private helpers, or another family are forbidden.
- Expose only supported Material configuration, semantic state, required native behavior, consumer anatomy, and explicit extensions.
- Update all in-repository consumers during migration instead of retaining legacy aliases by default.

Extract behavior only when current ownership requires it. Similar syntax, line count, possible reuse, or test convenience is insufficient.

Do not create a universal Material base, runtime token registry, generic resolver, CSS DSL, cross-family state machine, second theme/overlay system, production state-matrix component, generic component-test DSL, or separate package infrastructure without a current requirement.

Use shared typography utilities. Author standard CSS; compatibility transforms belong to the build pipeline.

## Standard component testing

Every new or migrated public component follows `component-testing.md`.

Required:

1. verify-managed architecture validation;
2. colocated `<Component>.test.ts` using Vue Test Utils for public contract and non-browser structural wiring;
3. exactly one canonical Storybook export named `StateMatrix`;
4. visible row/column labels and complete coverage of supported visual states and distinct state-rendering routes;
5. Playwright visual regression of the bounded matrix or its labelled sections;
6. Storybook Playwright behavior tests when the component owns browser-dependent behavior;
7. focused Vitest tests when pure behavior is extracted;
8. preservation checks for changed consumers.

The matrix is exhaustive by supported visual state, not by every equivalent size, label, icon, or content combination. Use separate variants/sizes stories for ordinary configuration breadth.

Do not:

- verify appearance in Vitest, happy-dom, or Vue Test Utils;
- use forced matrix states to prove behavior acquisition or cleanup;
- omit a reachable supported state;
- create one screenshot per cell;
- claim human visual review from automated execution.

Initial state matrices and intentional visual baseline updates remain subject to human comparison with the official sources named in the blueprint.

## Legacy migration

A focused family migration must update atomically:

- source location and internal imports;
- family blueprint and library migration map;
- public Material exports;
- all consumer imports;
- canonical `StateMatrix` and Storybook documentation;
- contract, browser, visual, pure-behavior, and consumer tests as applicable;
- visual snapshots and risk registration;
- component/foundation registries when ownership or status changes;
- old path removal.

A temporary compatibility re-export requires an explicit consumer list and removal target and must not receive new usage.

## Verification

Use the standard proof set from `component-testing.md`, narrowed only by explicit ownership:

- library location, dependency direction, public export, and no-deep-import checks;
- component-choice/composition evidence for integrated consumers;
- contract tests for API, semantics, ARIA, defaults, invalid combinations, and structural wiring;
- foundation dependency/registry consistency;
- architecture, token ownership, and rendered-property matrix validation;
- complete state-matrix coverage and visual baseline;
- real browser checks for focus, keyboard, pointer/touch, overlays, adaptivity, computed CSS, and actual owners when applicable;
- pure behavior tests when helpers/composables exist;
- changed-consumer import and behavior preservation;
- representative consumer checks for foundation corrections/replacements;
- obsolete legacy path removal;
- truthful manual visual-review status.

Before completion, family README, library map, foundation/component registries, owner contracts, code, public exports, Storybook, tests, risk registration, and snapshots must agree. No empty layers, unnecessary aliases, local foundation substitutes, parallel obsolete paths, permanent compatibility exports, missing state routes, or speculative abstractions may remain.
