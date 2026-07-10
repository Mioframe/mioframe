# @shared/lib/reorder

A framework-level Vue 3 composable and directive set for live item reordering through pointer
(mouse and touch) dragging. It owns pointer activation, physical displacement geometry, and
native-scroll-ownership autoscroll — nothing else.

## Purpose

`useReorder` lets a consumer make an existing list of items draggable-to-reorder without handing
over ownership of the list's data, visuals, or persistence. The library only decides _when_ and
_where_ to fire a reorder request; the consumer decides everything else.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useReorder } from '@shared/lib/reorder';

interface Item {
  id: string;
  label: string;
}

const items = ref<Item[]>([
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
]);

const { draggingKey, vReorderContainer, vReorderItem, vReorderIgnore } = useReorder({
  keys: () => items.value.map((item) => item.id),
  onReorder: ({ fromIndex, toIndex }) => {
    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    items.value = next;
  },
});
</script>

<template>
  <div v-reorder-container>
    <div
      v-for="item in items"
      :key="item.id"
      v-reorder-item="item.id"
      :class="{ 'is-dragging': draggingKey === item.id }"
    >
      {{ item.label }}
      <button type="button" v-reorder-ignore @click="onRemove(item.id)">Remove</button>
    </div>
  </div>
</template>
```

## Source-of-truth contract

The consumer owns the ordered data. `useReorder` receives it as
`keys: MaybeRefOrGetter<readonly Key[]>` (`Key extends string | number`) and never mutates it,
never keeps a second authoritative copy, and never infers identity from array indexes or DOM
position — only from the key passed to `v-reorder-item`.

For every live move, `onReorder({ key, fromIndex, toIndex })` fires and the consumer must update
its reactive order **synchronously**. Vue may commit the resulting DOM update asynchronously; the
library waits for that commit before evaluating the next potential move.

If the controlled order does not reflect a requested move, or changes incompatibly mid-session
(the active key disappears, for example), the session cancels safely instead of continuing with
divergent state.

## Directive contract

- `v-reorder-container`: apply once per `useReorder` instance, on the element that bounds
  reordering.
- `v-reorder-item="item.key"`: apply on each reorderable item's root element. Registered items may
  be arbitrary descendants of the container, not only direct children.
- `v-reorder-ignore`: apply on a custom interactive descendant (anything that isn't a native
  `button`/`a`/`input`/`textarea`/`select`/editable element) that must not start drag activation.

Nested reorder containers and cross-container item movement are not supported. Only items
registered by the same `useReorder` instance participate together, and duplicate keys are a
consumer contract violation (the most recently mounted element wins).

The registered active element must keep its normal flow layout box while dragging — this library
renders nothing extra and does not remove or collapse it. If your visual treatment (e.g. a
dragging class) would otherwise change the element's box, keep the box stable through that
treatment.

## Callback semantics

- `onDragStart({ key, index })` fires exactly once, only after activation succeeds.
- `onReorder({ key, fromIndex, toIndex })` may fire multiple times during one live drag; at most
  once per animation frame.
- `onDragEnd({ key, initialIndex, finalIndex, cancelled })` fires exactly once for every fired
  `onDragStart`.
- A pending pointer gesture that never activates (released before the threshold, or cancelled
  before the touch long-press delay) fires none of these callbacks.
- `draggingKey` becomes the active key on activation and returns to `null` when the session ends.

## Visual ownership boundary

This library owns no visual representation. It renders no overlay, clone, placeholder, or
Teleported content, and applies no transforms, transitions, or animations. All dragged-state
styling, spacing, and motion are the consumer's responsibility — use `draggingKey` to drive it.

## Activation

- **Mouse**: `pointerdown` starts a pending session; it activates after at least 4 CSS px of
  movement. Releasing before that threshold is a normal click.
- **Touch**: activation requires a long press (`longPressDelay`, default `400`ms). Movement beyond
  an 8 CSS px slop before the delay elapses cancels the pending gesture. Native scrolling is not
  blocked before activation; after activation, the gesture captures the pointer and suppresses
  scrolling, context menus, and text selection for that gesture only.

A normal completed drag suppresses only its own resulting synthetic click; an unrelated click
immediately after is unaffected.

## Autoscroll

Once activated, dragging near a visible edge of the reorder container or any of its existing
scrollable ancestors scrolls that target using its own native scrolling — this library never makes
an element scrollable by changing its styles. Horizontal and vertical axes scroll independently
and can be owned by different ancestors; when the nearest eligible target reaches its scroll
limit, the chain falls through to the next one. Speed increases smoothly near an edge and
continues while the pointer is held still; a pointer beyond a visible edge keeps scrolling and
reordering intuitively rather than stalling.

## Cancellation

A session cancels safely on `Escape`, `pointercancel`, lost pointer capture, a second pointer,
window blur, the document becoming hidden, container/active-item unmount, or an incompatible
controlled-order change. When rollback is still valid, the active item is live-reordered back to
its initial index before the session ends; otherwise it ends as cancelled without inventing or
overwriting consumer state. Every activated session ends with exactly one `onDragEnd`, and all
timers, listeners, capture, and animation-frame work are cleaned up deterministically.

## Non-goals

This library does not provide: consumer migration, cross-container transfer, nested containers,
keyboard reordering, accessibility announcements, virtualized-list adapters, visual dragged
layers/overlays/clones, persistence, domain-specific list behavior, or configurable layout
direction/autoscroll strategy.
