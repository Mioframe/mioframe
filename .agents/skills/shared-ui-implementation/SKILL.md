---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. For public MD* components, follows deterministic layered-v1 authoring, the smallest applicable file profile, source-backed API and anatomy, property-specific state resolution, explicit DOM ownership, and focused verification without speculative abstractions.'
paths:
  - 'src/shared/ui/**'
  - 'tests/e2e/visual/shared-ui/**'
---

# Shared UI implementation

Use this skill for `src/shared/ui` work. Pair public Material component work with `material3-guidelines` and the relevant sections of `docs/material-3/component-architecture.md`.

## Public Material authoring gate

Before production edits, record one mode:

- `standard-authoring`: derive the component blueprint from required scenarios, official Material documentation, repository rules, native semantics, and deterministic architecture rules;
- `handoff-authoring`: follow a ready exact family-contract delta;
- `blocked`: an escalation condition is present.

A separate architect handoff is not required for normal source-backed component creation. Create or update the compact family README blueprint before production code and proceed only with `Unresolved: none` and `Readiness: ready`.

Use `blocked` rather than inventing behavior when sources conflict, ownership crosses boundaries, a new public project extension is required, or new generic infrastructure appears necessary.

## Bounded preparation

1. Read scoped rules and the current family README.
2. Inspect named consumers and the nearest relevant shared component.
3. Read only relevant official Material pages.
4. Derive the minimum complete supported surface.
5. Write the compact blueprint.
6. Implement the smallest applicable profile.

Do not begin with broad repository exploration or unrelated component comparisons.

## Architecture profile

Apply the exact profile rules from `component-architecture.md`:

- `simple`: Vue and rendering layers;
- `configured`: add configuration routes;
- `stateful`: add configuration routes and state resolution;
- add a component token file only when the component owns at least one exact official token;
- add a family token file only under the documented multi-component ownership condition.

Do not create empty token, route, or state layers for symmetry. Do not merge a required layer into another file.

Optional family anatomy, behavior, composable, or context files are allowed only under objective architecture conditions. Similar code or possible reuse is insufficient.

## Vue and DOM ownership

- Keep typed props, emits, slots, small named computeds, runtime fact acquisition, native bindings, events, and anatomy in Vue.
- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit on the native owner.
- Prefer native button, link, input, and form behavior. Do not synthesize activation to repair unsuitable DOM.
- Use controlled fallthrough attrs only when necessary; component-owned DOM-critical attrs remain explicit.
- Use small named computeds rather than inline boolean algebra, topology objects, render plans, or broad options objects.
- Vue acquires runtime facts; CSS resolves visual values.

## Public API

Derive the smallest coherent API:

- add props only for requested Material configuration, semantic state, required native behavior, or explicit project extensions;
- use official Material vocabulary and values;
- add slots only for supported consumer-provided anatomy;
- emit only component-owned state changes or actions;
- do not expose private anatomy, token routes, test controls, or speculative flexibility;
- update in-repository consumers instead of keeping compatibility aliases by default.

If Material guidance does not determine invalid-combination behavior, use `blocked` rather than inventing normalization.

## Styling ownership

- Token files contain only exact official `--md-comp-*` defaults on approved roots and never depend on active configuration or state.
- Route files select configuration values only.
- State files select semantic banks, resolve properties independently, and map generic foundation bridges.
- Rendering files apply final values to actual DOM owners and own layout, geometry, transitions, and presentation.
- Do not apply one state precedence to every property.
- Do not rely on inheritance when the blueprint names a more specific owner.
- Do not use `:deep()` to style another component's internal anatomy.
- Consumers outside a family must not read family-private variables or target internal classes.

## Generic foundations

Generic state-layer, ripple, focus-indicator, elevation, and motion primitives read only generic private contracts. The consuming family maps its final value into the generic bridge.

Do not move family routes into foundations or create a generic Material base, runtime token registry, token resolver, CSS DSL, or cross-family state machine.

## Behavior extraction

Keep behavior local unless an objective extraction condition applies:

- `<Component>Behavior.ts` only for non-trivial keyboard, pointer, gesture, timing, or cleanup transitions requiring focused unit tests;
- a composable only when the same production behavior is required by at least two public components now;
- family context only for real public parent/child composition state that cannot use the existing contract cleanly.

Line count or duplicated syntax alone does not justify extraction.

## Verification

Use the smallest proof set covering the supported surface:

- component contract tests for API, native semantics, ARIA, invalid combinations, and component-owned behavior;
- architecture validation for profile, exact applicable layers, token ownership, and private boundaries;
- browser checks for focus, keyboard, pointer, gestures, computed CSS, public overrides, and actual property owners;
- matrix checks for reachable property resolvers and simultaneous outputs;
- representative Storybook and visual coverage for materially different geometry or appearance;
- one preservation check per changed existing consumer.

Do not test Vue, browser, or generic foundation internals the component does not own.

Before completion, verify that family README, production code, registry, Storybook, and tests agree. Do not report completion with empty layers, known violations, unsupported claims, parallel obsolete logic, or unrequested abstractions.
