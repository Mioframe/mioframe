---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. Enforces source-backed Material usage, accepted foundation dependencies, minimum component profiles, explicit DOM ownership, native semantics, and focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'tests/e2e/visual/shared-ui/**'
---

# Shared UI implementation

Use for `src/shared/ui` work. Public Material components also follow `material3-guidelines`, `component-architecture.md`, and `foundation-architecture.md`.

## Before production edits

Record `standard-authoring`, `handoff-authoring`, or `blocked`.

For `standard-authoring`:

1. read scoped rules, current family README, and applicable foundation-registry records;
2. inspect named consumers and the nearest relevant shared component;
3. read only relevant official component/foundation pages;
4. derive the minimum supported surface and Material usage contract;
5. declare foundation dependencies and any foundation delta;
6. write the ready family blueprint;
7. select the smallest component profile.

Use `blocked` rather than inventing behavior, ownership, public extensions, generic infrastructure, or local foundation substitutes.

## Component structure

Use exactly one profile from `component-architecture.md`:

- `simple`;
- `configured`;
- `stateful`;
- `configured-stateful`.

Add token, route, state, family anatomy, behavior, composable, or context files only under their documented objective conditions. Empty or convenience-only layers are forbidden.

## Usage and ownership

The family blueprint records intended/prohibited usage, composition, placement, adaptivity, and product integration.

Components own public API, native semantics, anatomy, component behavior, tokens, property routing, and rendering. Product layers own information architecture, component choice, placement, workflow, and adaptive composition.

Do not add product-specific behavior to a shared primitive for one consumer.

## Foundation dependencies

Consume the owners named by `foundation-registry.md`.

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

## Public API and extraction

Expose only supported Material configuration, semantic state, required native behavior, consumer anatomy, and explicit extensions. Update in-repository consumers instead of retaining aliases by default.

Extract behavior only when current ownership requires it. Similar syntax, line count, or possible reuse is insufficient.

Do not create a universal Material base, runtime token registry, generic resolver, CSS DSL, cross-family state machine, or second theme/overlay system.

Use shared typography utilities. Author standard CSS; compatibility transforms belong to the build pipeline.

## Verification

Use the smallest applicable proof set:

- component-choice/composition evidence for integrated consumers;
- contract tests for API, semantics, ARIA, and component-owned behavior;
- foundation dependency/registry consistency;
- architecture and token ownership validation;
- browser checks for focus, keyboard, pointer/touch, overlays, adaptivity, computed CSS, and actual owners;
- property-matrix checks;
- representative Storybook/visual coverage;
- changed-consumer preservation;
- representative consumer checks for foundation corrections/replacements.

Before completion, family README, foundation/component registries, owner contracts, code, Storybook, and tests must agree. No empty layers, unnecessary aliases, local foundation substitutes, parallel obsolete paths, or speculative abstractions may remain.
