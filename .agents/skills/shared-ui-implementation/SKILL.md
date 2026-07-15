---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. Enforces the Material library boundary, source-backed usage, accepted foundation dependencies, minimum component profiles, explicit DOM ownership, native semantics, and focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'tests/e2e/visual/shared-ui/**'
---

# Shared UI implementation

Use for `src/shared/ui` work.

Public Material components also follow:

- `material3-guidelines`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/foundation-architecture.md`.

## Library routing

`src/shared/ui/material` is the canonical Material library root.

- Create new official public `MD*` components only under `material/components/<family>`.
- Create new Material foundation runtime artifacts only under `material/foundation/<domain>`.
- Create Material patterns only under `material/patterns/<pattern>` after the documented pattern gate passes.
- Keep generic infrastructure and project-specific shared UI outside the Material library.
- Treat existing Material directories outside the root as legacy, not as templates.

A strict local repair may stay at a legacy path only when it preserves location, public API, foundation contracts, behavior, and unrelated output. New Material surface at a legacy path is forbidden.

## Before production edits

Record `standard-authoring`, `handoff-authoring`, or `blocked`.

For `standard-authoring`:

1. read scoped rules, the library map, current family README, and applicable foundation-registry records;
2. inspect named consumers and the nearest relevant shared integration pattern;
3. read only relevant official component/foundation pages;
4. derive the minimum supported surface and Material usage contract;
5. declare foundation dependencies and any foundation delta;
6. resolve canonical library location, public export, and consumer migration;
7. write the ready family blueprint;
8. select the smallest component profile.

Use `blocked` rather than inventing behavior, ownership, public extensions, generic infrastructure, local foundation substitutes, or migration compatibility.

## Component structure

Inside `material/components/<family>`, use exactly one profile from `component-architecture.md`:

- `simple`;
- `configured`;
- `stateful`;
- `configured-stateful`.

Add token, route, state, family anatomy, behavior, composable, or context files only under their documented objective conditions. Empty or convenience-only layers are forbidden.

Each family owns its README, family `index.ts`, production files, stories, and focused tests. The root Material barrel is curated and must not be imported internally by library modules.

## Usage and ownership

The family blueprint records intended/prohibited usage, composition, placement, adaptivity, product integration, canonical path, current legacy path when applicable, and migration mode.

Components own public API, native semantics, anatomy, component behavior, tokens, property routing, and rendering. Product layers own information architecture, component choice, placement, workflow, and adaptive composition.

Do not add product-specific behavior to a shared primitive for one consumer. Do not move a project-specific wrapper into `material/components` merely to centralize files.

## Foundation dependencies

Consume the owners named by `foundation-registry.md` and the physical owners recorded in the Material library map.

Do not recreate theme, units, typography, shape, elevation, motion, state/ripple/focus, icons, density, accessibility, overlay, or adaptive behavior locally.

Generic foundation bridges remain component-agnostic. Component families map final values into those bridges.

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

Extract behavior only when current ownership requires it. Similar syntax, line count, or possible reuse is insufficient.

Do not create a universal Material base, runtime token registry, generic resolver, CSS DSL, cross-family state machine, second theme/overlay system, or separate package infrastructure without a current requirement.

Use shared typography utilities. Author standard CSS; compatibility transforms belong to the build pipeline.

## Legacy migration

A focused family migration must update atomically:

- source location and internal imports;
- family blueprint and library migration map;
- public Material exports;
- all consumer imports;
- Storybook and tests;
- component/foundation registries when ownership or status changes;
- old path removal.

A temporary compatibility re-export requires an explicit consumer list and removal target and must not receive new usage.

## Verification

Use the smallest applicable proof set:

- library location, dependency direction, public export, and no-deep-import checks;
- component-choice/composition evidence for integrated consumers;
- contract tests for API, semantics, ARIA, and component-owned behavior;
- foundation dependency/registry consistency;
- architecture and token ownership validation;
- browser checks for focus, keyboard, pointer/touch, overlays, adaptivity, computed CSS, and actual owners;
- property-matrix checks;
- representative Storybook/visual coverage;
- changed-consumer import and behavior preservation;
- representative consumer checks for foundation corrections/replacements;
- obsolete legacy path removal.

Before completion, family README, library map, foundation/component registries, owner contracts, code, public exports, Storybook, and tests must agree. No empty layers, unnecessary aliases, local foundation substitutes, parallel obsolete paths, permanent compatibility exports, or speculative abstractions may remain.