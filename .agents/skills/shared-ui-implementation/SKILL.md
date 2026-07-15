---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. Enforces owner boundaries, explicit DOM/native contracts, minimal component structure, Material library routing, and focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Shared UI implementation

Use for `src/shared/ui` work.

For public Material components, also use:

- `material3-guidelines`;
- `component-contract-testing`;
- `ui-browser-behavior` when browser-owned behavior exists;
- `visual-regression-testing`;
- the canonical Material architecture documents.

This skill owns Vue/shared-UI implementation discipline. It does not duplicate the complete Material blueprint or test contract.

## Routing

- New official public `MD*` components belong only under `src/shared/ui/material/components/<family>`.
- New Material foundation runtime/testing owners belong only under `material/foundation/<domain>`.
- Material patterns require the documented pattern gate.
- Generic infrastructure and project-specific shared UI remain outside the Material library.
- Existing Material locations outside the library are legacy, not templates.

A strict legacy repair may remain in place only when `Architecture impact: none` is valid. New Material ownership at a legacy path is forbidden.

## Before production edits

For a Material component:

1. record `standard-authoring`, `handoff-authoring`, or `blocked`;
2. complete the canonical family blueprint from `component-architecture.md`;
3. resolve current/canonical paths, exports, and consumers;
4. confirm accepted foundation dependencies and change modes;
5. select the smallest component profile;
6. plan contract, browser, visual, pure-behavior, consumer, and review evidence.

Use `blocked` rather than inventing behavior, ownership, compatibility, extensions, local foundation substitutes, generic infrastructure, or test-only production APIs.

## Ownership

Components own:

- public API and native semantics;
- anatomy and DOM/accessibility owners;
- component behavior and state meaning;
- component tokens, configuration routing, property-specific state resolution, and final rendering;
- family stories and component-specific verification.

Product layers own:

- information architecture;
- component choice and placement;
- workflow and domain behavior;
- product-level adaptive composition.

Do not move product-specific behavior or wrappers into an official component family merely to centralize files.

## Vue and DOM

- Keep typed props, emits, slots, small named computeds, runtime fact acquisition, native bindings, events, and anatomy in Vue.
- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit on the actual owner.
- Prefer native activation, navigation, and form behavior.
- Use controlled fallthrough attrs only when necessary.
- Avoid inline boolean algebra, topology objects, render plans, style resolvers, and broad option bags.
- Vue acquires runtime facts; CSS resolves visual values.
- Parent components must not style child internals through `:deep()`.

## Component files

Use exactly one profile from `component-architecture.md`:

- `simple`;
- `configured`;
- `stateful`;
- `configured-stateful`.

Add token, route, state, family-anatomy, behavior, composable, or context files only when their objective condition applies. Empty or convenience-only layers are forbidden.

The family README is the complete contract. The root Material barrel is curated and must not be imported internally by library modules.

## Styling

- Token files own exact official component-token defaults only.
- Route files own configuration selection only.
- State files own property-specific state resolution and state-varying foundation bridges.
- Rendering files apply final values to actual DOM owners.
- Static values use canonical sources directly when possible.
- Rendered private variables exist only for state-resolved output or stable generic bridge input.
- Do not use one state precedence for every property.
- Family-private contracts must not escape the family.
- Use shared typography utilities and standard CSS; compatibility transforms belong to the build pipeline.

## Foundation dependencies

Consume the current owner named by the registry and the canonical owner named by the library map.

Do not recreate theme, units, typography, shape, elevation, motion, state/ripple/focus, icons, density, accessibility, overlay, or adaptivity locally.

Generic foundation bridges remain component-agnostic. Components map their final values into those bridges.

Verification-only adapters belong to the owning foundation testing surface. Do not add family-local forced-state systems or public Storybook-only props/classes.

Follow `foundation-architecture.md` for additive, correction, replacement, refresh, and relocation decisions.

## Public API and imports

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code imports accepted family/foundation entry points, not the root barrel.
- External deep imports into implementation/testing files are forbidden.
- Expose only supported Material configuration, semantic state, required native behavior, consumer anatomy, and explicit extensions.
- Update repository consumers during migration instead of retaining aliases by default.

Extract behavior only when current ownership requires it. Similar syntax, line count, hypothetical reuse, or test convenience is insufficient.

Do not create a universal Material base, runtime registry, generic resolver, CSS DSL, cross-family state machine, second theme/overlay system, production matrix component, generic test DSL, or separate package infrastructure without a current requirement.

## Testing

Every new or migrated public Material component follows `component-testing.md`:

- static and structured architecture checks;
- colocated Vue Test Utils contract tests;
- exactly one canonical `StateMatrix`;
- visual regression for every distinct supported component-owned visual route;
- real browser behavior tests when applicable;
- pure helper/composable tests when applicable;
- consumer preservation checks;
- architecture/Material/human visual review when required.

Non-visual states belong in contract or browser tests. Forced states prove appearance only. Do not create one snapshot per cell or claim human review from automation.

## Migration

A focused family migration updates atomically:

- source paths and imports;
- canonical family blueprint and library map;
- public exports and all consumers;
- Storybook and canonical matrix;
- contract, browser, visual, pure, and consumer tests;
- snapshots and risk registrations;
- affected registries;
- obsolete path removal.

Temporary compatibility exports require exact consumers, no new usage, and a removal target.

## Completion

The family blueprint, library map, registries, owner contracts, code, exports, Storybook, tests, snapshots, risk registration, and consumers must agree. No empty layers, local substitutes, parallel obsolete paths, permanent aliases, missing distinct visual routes, or speculative abstractions may remain.
