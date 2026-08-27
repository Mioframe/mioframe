---
name: vue-component-implementation
description: 'Use this skill before implementing or reviewing .vue components or UI composables to define the component contract and avoid imperative DOM-style coordination, dispatchEvent/querySelector communication, broad v-bind prop bags, and unjustified deep style overrides.'
---

# Vue component implementation

Use this skill before writing or materially changing a `.vue` component or a UI composable that backs one. It complements `implementation-preflight`; it does not replace owner-map or acceptance/risk work.

## When to use

Use for any task that adds or changes:

- a `.vue` single-file component;
- a composable that owns component-facing reactive state, DOM refs, or lifecycle;
- shared UI primitives, widget/pane composition, or feature dialogs, sheets, and menus.

Skip for copy-only text changes, prop renames with no contract change, or non-UI logic.

## Required Vue component contract

Write this short contract before the first production edit:

1. **Root/render contract**: stable root, block class, and whether a root child component is used instead of a wrapper.
2. **Props**: typed accepted props.
3. **Emits**: typed user-action or selection events.
4. **Slots**: exposed slots and forwarded slot props.
5. **Attrs forwarding**: whether and where transparent attribute forwarding is part of the public contract.
6. **Derived state/computed plan**: computed values and why no manual state machine is needed.
7. **Interaction ownership**: actions owned locally versus delegated through emits.
8. **DOM access/ref justification**: concrete browser API need.
9. **Show/hidden ownership**: parent composition decides whether the component renders.
10. **Browser/visual verification**: owning proof or reason none applies.

Resolve unclear items before editing.

## Declarative state rules

- Prefer named `computed` values over complex inline expressions or conditional chains.
- Do not build a custom state machine when derived state is enough.
- Move non-trivial pure derivation into named computed values or pure helpers.
- Move lifecycle-managed side effects into composables that own setup and cleanup.

## Component communication rules

- Use props down, emits up, and slots for composition.
- Function-valued props are allowed only when the function is genuinely downward data/strategy input, such as a pure formatter, predicate, key resolver, comparator, or an explicitly documented dependency owned by the child contract.
- Do not pass parent-owned commands, mutation callbacks, permission checks, confirmation functions, async gates, or `before*`/`resolve*` orchestration downward as component props. Those are upward interaction intents: emit a typed event and let the parent update controlled props/model state after any async work succeeds.
- If opening/rendering a child surface requires asynchronous parent approval, the requesting component emits intent; the parent owns the pending decision and the controlled open/configuration state. Do not await a parent callback prop and then mutate child-local visibility state.
- Do not use `dispatchEvent` or custom DOM events for component-to-component communication.
- Do not use `querySelector` or `querySelectorAll` to coordinate siblings or children.
- Template refs and direct DOM access are allowed only for real browser API needs such as focus, measurement, scrolling, or third-party integration.

## Event handler rules

- Prefer named handlers from `<script setup>`.
- Named handler calls with local template context are allowed.
- Anonymous inline arrow or function handlers are forbidden.
- Direct inline mutations in event expressions are forbidden.
- Non-trivial event logic belongs in a named handler.

## Styling and deep selector rules

- `:deep()` is allowed only at an explicit documented integration boundary.
- Do not style child private classes from a parent unless the child is the documented boundary.
- Prefer child props, slots, or CSS custom properties over deep overrides.

## v-bind and attrs rules

- Do not use `$attrs`, `useAttrs()`, or bare `v-bind` as a generic escape hatch.
- Attribute forwarding is allowed only for documented transparent host/adaptor components.
- Do not spread broad untyped configuration objects to hide the real component contract.

## Architecture-sensitive rules

These durable lessons require explicit review rather than syntactic enforcement:

- Do not pass the whole `props` object into shared UI composables. Pass explicit refs/values or a narrow typed options object.
- Runtime development warnings must not replace a strict public API.
- Do not use `defineExpose` as a normal component API; reserve it for documented browser/focus integration.
- Do not use pointer-event pass-through or overlay stacking to route interactions unless the component contract owns the geometry and browser/visual proof covers it.
- Do not suppress focus visuals.
- Non-scoped CSS in shared UI is allowed only for documented component-family internals or token/theme files.
- `!important` is forbidden.

## Testing and verification

- Use `component-contract-testing` for render, props, emits, slots, and wiring contracts.
- Use `ui-browser-behavior` and visual proof for layout, focus, pointer/touch, scrolling, teleport, overlays, or Material state visuals.
- Passing lint and type-check is not proof of correct Vue composition.

## Review checklist

Reject or return for rework when:

1. The component uses DOM custom events instead of emits.
2. The component or tests use selectors for coordination without a justified low-level integration.
3. A broad untyped object hides the real prop contract.
4. `:deep()` reaches into another component without a documented boundary.
5. The component owns a normal empty/hidden render path instead of the parent deciding visibility.
6. Template logic builds an ad hoc state machine where computed derivation is sufficient.
7. The root contract is unstable.
8. Event bindings use anonymous functions or inline mutations.
9. A function prop is used to invoke parent-owned orchestration, request permission, or perform an upward mutation instead of a typed emit plus controlled parent state.

Pass condition:

- attribute forwarding is absent or documented as a transparent host/adaptor contract;
- event bindings use named handlers or named handler calls with local context;
- function-valued props, when present, are true downward strategy/data inputs rather than callback channels to the parent.

## Forbidden

- Treating attribute forwarding as a default allowed pattern.
- Passing the whole props object into shared UI composables.
- Passing parent commands, async gates, or permission callbacks as component props.
- Using `defineExpose` as a normal component API.
- Suppressing focus visuals.
- Using non-scoped CSS in shared UI without a documented family contract.
- `!important`.

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

Wrong — parent permission callback as a prop:

```vue
<script setup lang="ts">
const props = defineProps<{ beforeOpen: () => Promise<boolean> }>();
const isOpen = ref(false);
const onOpen = async () => {
  if (await props.beforeOpen()) {
    isOpen.value = true;
  }
};
</script>
```

Right — upward request with parent-controlled state:

```vue
<!-- Child.vue -->
<script setup lang="ts">
defineProps<{ open: boolean }>();
const emit = defineEmits<{ requestOpen: []; close: [] }>();
const onOpen = () => emit('requestOpen');
const onClose = () => emit('close');
</script>

<!-- Parent.vue -->
<script setup lang="ts">
const isOpen = ref(false);
const onRequestOpen = async () => {
  if (await canOpen()) {
    isOpen.value = true;
  }
};
const onClose = () => {
  isOpen.value = false;
};
</script>

<template>
  <Child :open="isOpen" @request-open="onRequestOpen" @close="onClose" />
</template>
```

Wrong — selector coordination:

```vue
<script setup lang="ts">
const onOpen = () => {
  document.querySelector('.menu')?.classList.add('menu_open');
};
</script>
```

Right — parent-owned state:

```vue
<script setup lang="ts">
const onCloseMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <MDMenu :open="isMenuOpen" @close="onCloseMenu" />
</template>
```

Wrong — broad prop bag:

```vue
<MDButton v-bind="buttonConfig" />
```

Right — explicit props:

```vue
<MDButton :label="label" :disabled="isDisabled" @click="onClick" />
```

Wrong — anonymous handler and inline mutation:

```vue
<li v-for="item in items" :key="item.id">
  <MDButton @click="() => onSelectItem(item.id)" />
  <MDButton @click="selectedId = item.id" />
</li>
```

Right — named handler call:

```vue
<li v-for="item in items" :key="item.id">
  <MDButton @click="onSelectItem(item.id)" />
</li>
```
