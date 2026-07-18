---
name: vue-component-implementation
description: 'Use before implementing or reviewing Vue components or UI composables. Define the component contract, keep DOM structure minimal, and avoid imperative DOM coordination, broad prop bags, and unjustified style overrides.'
---

# Vue component implementation

Use before materially changing a `.vue` component or a UI composable that owns component-facing reactive state, DOM refs, or lifecycle.

Skip for copy-only changes, prop renames with no contract change, or non-UI logic.

## Required component contract

Write a short contract before the first production edit:

1. **Render contract** — minimal stable rendered structure, semantic owner, and whether an existing child component or a Vue fragment avoids a wrapper.
2. **Props** — typed inputs using type-based `defineProps`.
3. **Emits** — typed user-action outputs using type-based `defineEmits`.
4. **Slots** — exposed slots and slot props using `defineSlots` when applicable.
5. **Attrs** — whether transparent forwarding is part of the public contract and which element receives it.
6. **Derived state** — named computed values and why no manual state machine is needed.
7. **Interaction ownership** — actions owned locally versus delegated through emits.
8. **DOM access** — each ref/direct DOM use and its concrete browser API need.
9. **Visibility ownership** — parent composition decides whether the component renders; no normal empty-render mode.
10. **Browser/visual proof** — applicable browser, Storybook, or visual verification.

Resolve unclear ownership before editing.

## Minimal DOM structure

Follow the repository-wide rule that every DOM node needs a real responsibility.

- Do not add a wrapper only to obtain one root node, attach a class, simplify a selector, expose a test hook, hold transient state, or anticipate future styling.
- Prefer an existing semantic element or child component as the root when it can own the contract correctly.
- Use a Vue fragment when multiple semantic siblings are correct and no single-root attrs, ref, transition, layout, or integration contract is required.
- Add an element only when semantics, accessibility, layout, interaction geometry, rendering, clipping/stacking, transition ownership, teleport/integration, or a browser API requires it.
- CSS pseudo-elements may own purely decorative rendering when semantics and interaction are unaffected.
- Document a non-obvious wrapper’s responsibility in the component contract.

A stable render contract means predictable semantics and ownership; it does not require a single DOM element.

## Declarative state

- Prefer named `computed` values over complex inline expressions or `v-if` state chains.
- Do not build a state machine when existing reactive sources can derive the result.
- Move non-trivial pure derivation into computed values or pure helpers.
- Move lifecycle-managed side effects into a composable that owns setup and cleanup.

## Communication and DOM access

- Use props down, emits up, and slots for composition.
- Do not use `dispatchEvent` or custom DOM events for Vue component communication.
- Do not use `querySelector`/`querySelectorAll` to coordinate sibling or child components.
- Use template refs or direct DOM access only for real browser APIs such as focus, measurement, scrolling, selection, or third-party integration.
- Do not use `defineExpose` as a normal component API; reserve it for a documented browser/focus integration contract.

## Template event handlers

- Prefer named handlers: `@click="onClick"`.
- Named calls with local template context are allowed: `@click="onSelect(item.id)"`.
- Do not use anonymous inline functions or direct inline mutations.
- Put non-trivial event logic in `<script setup>`.

## Props and attrs

- Do not pass the complete `props` object into shared UI composables.
- Do not use broad untyped `v-bind` objects to hide the real component contract.
- `$attrs`, `useAttrs()`, and bare `v-bind` are allowed only for a documented transparent host/adaptor contract with an explicit receiver.
- Prefer explicit props, emits, slots, refs, or a narrow typed options object.

## Styling

- Ordinary component styles remain scoped.
- `:deep()` is allowed only at a documented integration boundary with an understood blast radius.
- Do not style another component’s internals when props, slots, or CSS custom properties can express the contract.
- Do not use pointer-event pass-through or overlay stacking to route interaction unless geometry ownership is explicit and browser proof covers it.
- Do not suppress focus visuals.
- `!important` is forbidden.

## Verification

- Use `component-contract-testing` for render, props, emits, slots, semantics, and wiring.
- Use `ui-browser-behavior` for layout, focus, pointer/touch, scrolling, teleport, overlays, measurement, or browser APIs.
- Use visual proof for appearance contracts.
- A lint/type-check pass does not prove correct composition or DOM ownership.

## Review rejection criteria

Reject or rework when:

1. a DOM node has no necessary responsibility;
2. a wrapper exists only to force a single root or simplify styling/testing;
3. DOM custom events or selectors coordinate Vue components;
4. broad prop/attrs bags hide the public contract;
5. `:deep()` crosses an undocumented boundary;
6. the component owns a normal empty/hidden render path instead of parent composition;
7. template logic creates an avoidable state machine;
8. event bindings use anonymous functions or inline mutations;
9. direct DOM access lacks a browser API justification;
10. render semantics or ownership change unpredictably between states.
