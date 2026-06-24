---
name: vue-component-implementation
description: 'Use this skill before implementing or reviewing .vue components or UI composables to define the component contract and avoid imperative DOM-style coordination, dispatchEvent/querySelector communication, broad v-bind prop bags, and unjustified deep style overrides.'
---

# Vue component implementation

Use this skill before writing or materially changing a `.vue` component or a UI composable that backs one. It complements `implementation-preflight`; it does not replace the owner-map or acceptance/risk matrix work that skill already requires.

## When to use

Use this skill for any task that adds or changes:

- a `.vue` single-file component;
- a composable that owns component-facing reactive state, DOM refs, or lifecycle;
- shared UI primitives, widget/pane composition, or feature dialogs/sheets/menus.

Skip it for copy-only text changes, prop renames with no contract change, or non-UI logic.

## Required Vue component contract

Write this short contract before the first production edit. Keep it to a few lines per item.

1. **Root/render contract**: single stable root element, its block class, and whether a root child component is used instead of a wrapper.
2. **Props**: typed props this component accepts (`defineProps` with type-based declaration).
3. **Emits**: typed emits this component raises (`defineEmits` with type-based declaration), named for the user action/selection, not a parent command.
4. **Slots**: slots exposed, and any slot props forwarded (`defineSlots`).
5. **Attrs forwarding**: whether `$attrs`/`useAttrs()`/`v-bind="attrs"` is forwarded transparently; this is allowed only for a documented transparent host/adaptor contract, and must state which root/child element receives it.
6. **Derived state/computed plan**: which values are `computed` from props/state, and why no manual state machine is needed.
7. **Interaction ownership**: which user actions this component owns vs. which it delegates to a parent via emit.
8. **DOM access/ref justification**: any `useTemplateRef`/DOM access and the concrete browser API need (focus, measurement, scroll, third-party integration).
9. **Show/hidden ownership**: confirms the parent composition decides whether this component renders at all; this component does not have a normal empty render path.
10. **Browser/visual verification**: which Playwright/e2e, Storybook visual, or browser smoke check covers the change, or why none applies.

If any item is unclear, resolve it before editing `.vue` files; do not start with broad pseudo-architecture and patch ownership later.

## Declarative state rules

- Prefer named `computed` values over complex inline template expressions or v-if chains.
- Do not build a custom state machine when derived `computed` state from existing reactive sources is enough.
- Move non-trivial pure derivation into named `computed` values or pure helpers.
- Move lifecycle-managed side effects into composables that own setup and cleanup.

## Component communication rules

- Use props down, emits up, and slots for parent/child composition.
- Do not use `dispatchEvent`/custom DOM events for component-to-component communication; use `defineEmits` instead.
- Do not use `querySelector`/`querySelectorAll` to coordinate with sibling or child components; use refs, props, emits, or provide/inject instead.
- Template refs and direct DOM access are allowed only for real browser API needs: focus, measurement, scrolling, or third-party widget integration. State that justification in the contract.

## Styling and deep selector rules

- `:deep()` is allowed only at an explicit, documented integration boundary (e.g. styling a known third-party node). State the boundary and blast radius in the contract or an inline comment; do not use it to casually reach into unrelated child internals.
- Do not style a child component's internal classes from a parent unless that child is the documented integration boundary.
- Prefer child props, slots, or CSS custom properties over deep selector overrides.

## v-bind and attrs rules

- Do not use `$attrs`, `useAttrs()`, or bare `v-bind` as a generic escape hatch. Attribute forwarding is allowed only for documented transparent host/adaptor components where forwarding is part of the public contract. Prefer explicit props, emits, and slots.
- Do not bind a broad, untyped object (`v-bind="someConfigObject"`) to hide the component's real prop/emit contract. Spell out the props the component actually accepts.

## Architecture-sensitive rules (not enforced by lint)

These PR #98 lessons are not safe to enforce syntactically; review them explicitly.

- Do not pass the whole `props` object into shared UI composables. Pass explicit refs/values or a narrow typed options object.
- Runtime dev warnings must not replace a strict public API. Prefer types, explicit props, emits, slots, and composition boundaries first.
- Do not use `defineExpose` as a normal component API. It is allowed only for documented browser/focus integration APIs.
- Do not use `pointer-events` pass-through or overlay stacking to route interactions unless the component contract explicitly owns this geometry and browser/visual verification covers hover, focus, click, touch, and disabled states.
- Do not suppress focus visuals. Shared UI may delegate focus rendering only to the project focus/state-layer system, and browser verification must cover it.
- Non-scoped CSS in shared UI is allowed only for documented component-family internals or token/theme files. Ordinary component implementation styles must stay scoped.
- `!important` is forbidden.

## Testing/verification rules

- Use `component-contract-testing` for small render/props/emits/slots/wiring contracts.
- Use `ui-browser-behavior` and Playwright/Storybook visual coverage for layout, focus, pointer/touch, scrolling, teleport, overlays, or Material state visuals.
- A passing lint/type-check is not proof of correct Vue composition; verify the contract above explicitly.

## Review checklist

Reject or send back for rework when:

1. The component dispatches/listens to DOM custom events instead of using emits.
2. The component or its tests use `querySelector`/`querySelectorAll` for coordination (not a justified low-level browser integration).
3. A broad untyped object is `v-bind`-spread to hide the real prop contract.
4. `:deep()` reaches into another component's internals without a documented integration boundary.
5. The component has a normal empty/hidden render path instead of the parent deciding visibility.
6. Template logic builds an ad hoc state machine where `computed` derived state would do.
7. Root render contract is unstable (fragment root, conditional root shape, wrapper added only to satisfy single-root linting).

Pass condition:

- `$attrs` / `useAttrs()` forwarding is either absent or documented as a transparent host/adaptor contract.

## Forbidden

- Do not treat `$attrs` forwarding as a default allowed Vue pattern.
- Do not pass the whole `props` object into shared UI composables.
- Do not use `defineExpose` as a normal component API outside a documented browser/focus integration.
- Do not suppress focus visuals.
- Do not use non-scoped CSS in shared UI components without a documented component-family contract.
- `!important` is forbidden.

## Wrong/right examples

Wrong — DOM event communication:

```vue
<script setup lang="ts">
const onSave = () => {
  rootEl.value?.dispatchEvent(new CustomEvent('saved'));
};
</script>
```

Right — typed emit:

```vue
<script setup lang="ts">
const emit = defineEmits<{ save: [] }>();
const onSave = () => emit('save');
</script>
```

Wrong — querySelector coordination:

```vue
<script setup lang="ts">
const onOpen = () => {
  document.querySelector('.menu')?.classList.add('menu_open');
};
</script>
```

Right — props/emit-driven state owned by the parent:

```vue
<template>
  <MDMenu :open="isMenuOpen" @close="isMenuOpen = false" />
</template>
```

Wrong — broad prop bag hiding the contract:

```vue
<MDButton v-bind="buttonConfig" />
```

Right — explicit props:

```vue
<MDButton :label="label" :disabled="isDisabled" @click="onClick" />
```
