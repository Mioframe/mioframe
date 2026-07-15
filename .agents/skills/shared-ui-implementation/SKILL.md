---
name: shared-ui-implementation
description: 'Use before implementing or reviewing src/shared/ui primitives. For public MD* components, follows the deterministic layered-v1 authoring workflow, smallest applicable file profile, source-backed API and anatomy, property-specific state resolution, explicit DOM ownership, and focused verification without speculative abstractions.'
paths:
  - 'src/shared/ui/**'
  - 'tests/e2e/visual/shared-ui/**'
---

# Shared UI implementation

Use this skill for `src/shared/ui` work. Pair public Material component work with `material3-guidelines` and `docs/material-3/component-architecture.md`.

## Public Material authoring gate

Before production edits, record one mode:

- `standard-authoring`: the agent can derive the component blueprint from required scenarios, official Material documentation, repository rules, native semantics, and deterministic architecture rules;
- `handoff-authoring`: a ready handoff supplies an exact family-contract delta;
- `blocked`: an escalation condition from the architecture document is present.

A separate architect handoff is not required for normal source-backed component creation. The implementation agent must create or update the compact family README blueprint before production code and proceed only with `Unresolved: none` and `Readiness: ready`.

Use `blocked` rather than inventing behavior when sources conflict, ownership crosses established boundaries, a new public project extension is required, or a new generic abstraction appears necessary.

## Bounded preparation

Use this order:

1. read scoped rules and the current family README;
2. inspect named consumers and the nearest relevant shared component;
3. read only the relevant official Material pages;
4. derive the minimum complete supported surface;
5. write the compact blueprint;
6. implement the smallest applicable architecture profile.

Do not begin with broad repository exploration or unrelated component comparisons.

## Architecture profile

Apply the exact profile rules from `component-architecture.md`:

- `simple`: Vue + token + rendering files;
- `configured`: add configuration routes;
- `stateful`: add configuration routes and state resolution.

Do not create empty route or state layers for symmetry. Do not merge a required layer into another file.

Optional family token, family anatomy, behavior, composable, or context files are allowed only under the objective conditions in the architecture document. Similar code or possible future reuse is not sufficient.

## Vue and DOM ownership

- Keep typed props, emits, slots, small named computeds, runtime fact acquisition, native bindings, events, and anatomy in Vue.
- Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit on the actual native owner.
- Prefer native button, link, input, and form behavior. Do not synthesize activation to repair unsuitable DOM.
- Use controlled fallthrough attrs only when necessary; component-owned DOM-critical attrs must remain explicit.
- Use small named computeds rather than inline boolean algebra, topology objects, render plans, or broad options objects.
- Vue acquires runtime facts; CSS resolves visual values.

## Public API

Derive the smallest coherent public API:

- add props only for requested Material configuration, semantic state, required native behavior, or explicit project extensions;
- use official Material vocabulary and values;
- add slots only for supported consumer-provided anatomy;
- emit only component-owned state changes or actions;
- do not expose private anatomy, token routes, test controls, or speculative flexibility;
- update in-repository consumers with API changes instead of keeping compatibility aliases by default.

If Material guidance does not determine invalid-combination behavior, use `blocked` rather than inventing normalization.

## Styling ownership

- Canonical token files contain only official `--md-comp-*` defaults on approved root selectors and never depend on active configuration or state.
- Route files select configuration token banks only.
- State files select semantic banks, resolve each rendered property independently, and map generic foundation bridges.
- Rendering files apply final values to actual DOM owners and own layout, geometry, transitions, and presentation.
- Do not apply one state precedence to every property.
- Do not rely on inheritance when the blueprint names a more specific owner.
- Do not use `:deep()` to style another component's internal anatomy.
- Consumers outside a family must not read family-private variables or target internal classes.

## Generic foundations

Generic state-layer, ripple, focus-indicator, elevation, and motion primitives read only generic private contracts. The consuming family maps its final value into the generic bridge.

Do not move family routes into foundations, create a generic Material base, runtime token registry, token resolver, CSS-generation DSL, or cross-family state machine.

## Behavior extraction

Keep component-owned behavior local unless an objective extraction condition applies:

- use `<Component>Behavior.ts` only for non-trivial keyboard, pointer, gesture, timing, or cleanup transitions requiring focused unit tests;
- use a composable only when the same production behavior is required by at least two public components now;
- use family context only for real public parent/child composition state that cannot use the existing contract cleanly.

Line count or duplicated syntax alone does not justify extraction.

## Verification

Use the smallest proof set that covers the supported surface:

- component contract tests for API, native semantics, ARIA, invalid combinations, and component-owned behavior;
- architecture validation for selected profile, layer ownership, token ownership, and private-variable boundaries;
- browser checks for focus, keyboard, pointer, gestures, computed CSS, public overrides, and actual property owners;
- matrix checks for every reachable property resolver and declared simultaneous output;
- representative Storybook and visual coverage for materially different geometry or appearance;
- one preservation check per changed existing consumer.

Do not test Vue, browser, or generic foundation internals that the component does not own.

Before completion, verify that family README, production code, registry, Storybook, and tests agree. Do not report completion with known layer violations, unsupported claims, parallel obsolete logic, or unrequested abstractions.