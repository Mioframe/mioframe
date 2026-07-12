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
import { computed, ref } from 'vue';
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
const itemKeys = computed(() => items.value.map((item) => item.id));

const { draggingKey, vReorderContainer, vReorderItem } = useReorder({
  keys: itemKeys,
  onReorder: ({ fromIndex, toIndex }) => {
    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    items.value = next;
  },
});

const onRemove = (id: string): void => {
  items.value = items.value.filter((item) => item.id !== id);
};
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
      <button type="button" @click="onRemove(item.id)">Remove</button>
    </div>
  </div>
</template>
```

Native interactive descendants such as `button`, `a`, and form controls are excluded from drag
activation automatically. Use `v-reorder-ignore` only for a custom interactive descendant that is
not recognized natively.

## Source-of-truth contract

The consumer owns the ordered data. `useReorder` receives it as
`keys: MaybeRefOrGetter<readonly Key[]>` (`Key extends string | number`) and never mutates it,
never keeps a second authoritative copy, and never infers identity from array indexes or DOM
position — only from the key passed to `v-reorder-item`.

For every live move, `onReorder({ key, fromIndex, toIndex })` fires and the consumer must update
its reactive order **synchronously**. The library confirms acceptance synchronously too, by
re-reading the consumer's keys immediately after `onReorder` returns and comparing them to the
exact sequence it requested — it never waits for Vue's `nextTick` to decide whether a move was
accepted. `nextTick` is used only afterward, to wait for Vue's DOM commit of an already-accepted
move before remeasuring geometry on the next animation frame. If the original pointer is released
while that DOM commit is still pending, completion is deferred until the commit resolves rather
than reported prematurely — but the physical release still stops every part of the active gesture
immediately (pointer capture, the per-frame loop, and all temporary listeners): only the final
`onDragEnd` waits, nothing about the drag itself keeps running while it does. A later, real
`lostpointercapture` from that same release resolving is expected and never turns a deferred
completion into a cancellation.

Internally, an active session keeps a non-authoritative snapshot (`confirmedSequence`) of the
sequence it expects the consumer's `keys` to be. That snapshot exists only to verify the controlled
contract — it is never exposed publicly and never becomes another source of truth. Before
evaluating every frame, and immediately after every requested move, the library compares the
consumer's live sequence against that snapshot in full (not just the active item's resulting
index).

If the controlled order does not reflect a requested move, or changes incompatibly mid-session
(the active key disappears, or the consumer applies an unrelated change, for example), the session
cancels safely instead of continuing with divergent state. An incompatible external change is
never rolled back or overwritten by the library.

## Directive contract

- `v-reorder-container`: apply once per `useReorder` instance, on the element that bounds
  reordering.
- `v-reorder-item="item.key"`: apply on each reorderable item's root element. Registered items may
  be arbitrary descendants of the container, not only direct children.
- `v-reorder-ignore`: apply on a custom interactive descendant (anything that isn't a native
  `button`/`a`/`input`/`textarea`/`select`/editable element) that must not start drag activation.

Nested reorder containers and cross-container item movement are not supported. Only items
registered by the same `useReorder` instance participate together.

Duplicate identities are programmer errors, not supported runtime states, and are rejected
deterministically (a thrown `Error`) rather than resolved by "last mounted wins": a second
`v-reorder-container` mounted for the same `useReorder` instance, two different elements
registered under the same key, one element registered under two different keys, and duplicate
values in the controlled `keys` sequence.

The registered active element must keep its normal flow layout box while dragging — this library
renders nothing extra and does not remove or collapse it. If your visual treatment (e.g. a
dragging class) would otherwise change the element's box, keep the box stable through that
treatment.

## Callback semantics

- `onDragStart({ key, index })` fires exactly once, only after activation succeeds.
- `onReorder({ key, fromIndex, toIndex })` may fire multiple times during one live drag; at most
  once per animation frame.
- `onDragEnd({ key, initialIndex, finalIndex, cancelled })` fires exactly once for every fired
  `onDragStart` whose consumer callbacks complete without throwing. `finalIndex` is the item's
  actual index in the consumer's controlled `keys` when the session ended, or `-1` when the active
  key no longer exists there (for example, the consumer removed it mid-drag).
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

A normal completed drag arms one-shot click suppression immediately while handling the original
`pointerup` — before any finish/defer/cancel decision, since the browser's resulting `click`
follows that same physical release shortly after regardless of how the session concludes. That
suppression survives the session's own (synchronous) teardown long enough to intercept the click,
then removes itself immediately, or after a bounded fallback if no click ever arrives. It
suppresses only that one click; a later, genuinely unrelated click is never affected.

Cancelling mid-drag _before_ the physical release while the container and composable remain
mounted (`Escape`, blur, visibility loss, a second pointer, active-item removal, or a consumer
exception) cannot use that same immediate arm-and-fallback shape: the original pointer may stay
physically pressed far longer than one event-loop turn. In that case the library instead starts a
bounded release watcher for the original pointer's own `pointerup`, and arms suppression only once
that release actually happens. A matching `pointercancel` for that same pointer removes the watcher
without arming suppression (no click will follow), and a bounded safety timeout removes it if the
pointer never reports back at all. Either way, only the just-ended gesture's own click can ever be
suppressed — a genuinely unrelated later click always passes. Container unmount and composable
scope disposal are hard cleanup boundaries and remove this watcher immediately, as described below.

A direct `pointercancel` on an active drag (not a `pointercancel` observed by an already-running
release watcher) ends the original pointer stream completely and immediately: no click can ever
follow it, so it never arms suppression and never starts a release watcher of its own — a real
release of that same physical button afterward is treated as unrelated.

## Autoscroll

Once activated, dragging near a visible edge of the reorder container, any of its existing
scrollable ancestors, or the page viewport itself scrolls that target using its own native
scrolling — this library never makes an element scrollable by changing its styles, and never
treats the viewport as an ordinary overflow element. Horizontal and vertical axes scroll
independently and can be owned by different targets; when the nearest eligible target reaches its
scroll limit, the chain falls through to the next one, ending with the viewport as the final
target. Only ancestors that actually clip (not `overflow: visible`) reduce an item's visible
bounds. Speed increases smoothly near an edge and continues while the pointer is held still; a
pointer beyond a visible edge keeps scrolling and reordering intuitively rather than stalling.

Every edge and clipping measurement is based on each ancestor's client (content) viewport — its
border and any scrollbar gutter are excluded, never treated as scrollable or reorderable content.
A container whose visible area is fully clipped or scrolled away (zero width or height) has no
interior point to target at all: the library skips reordering for that frame instead of resolving
an arbitrary point.

## Cancellation

A session cancels safely on `Escape`, `pointercancel`, lost pointer capture, a second pointer
(anywhere, not only inside the container), window blur, the document becoming hidden,
container/active-item unmount, or an incompatible controlled-order change. A second pointer never
consumes its own event for the rest of the page — no `stopPropagation`, `stopImmediatePropagation`,
or `preventDefault` — it only prevents that same event from also starting a brand-new session in
this library. When rollback is still valid — the active key still exists and the consumer's live
sequence exactly matches what the library expects — the active item is live-reordered back to its
initial index before the session ends; otherwise it ends as cancelled without inventing or
overwriting consumer state, and never rolls back over an incompatible external mutation. Every
activated session whose consumer callbacks complete without throwing ends with exactly one
`onDragEnd`, and all timers, listeners, capture, and animation-frame work are cleaned up
deterministically.

Container unmount and composable scope disposal are hard cleanup boundaries: they cancel any
in-flight session immediately, in every phase, and unconditionally remove every remaining library
side effect — the active session runtime (animation frame, pointer capture, session listeners,
touch/context-menu/selection guards), click suppression, and any pending bounded release watcher
and its safety timeout, even if a consumer callback (`keys`, `onReorder`, or `onDragEnd`) throws
while that in-flight session is being cancelled. Nothing from an ended `useReorder` instance is
ever left listening on `window` or `document`. An active-item unmount alone (the container and
composable staying mounted) is different: if the original pointer may still be physically held,
the bounded release watcher described above is still armed and kept, because a later real release
on the same still-mounted container remains observable.

### Consumer exceptions

`keys`, `onDragStart`, and `onReorder` are outside the library's trust boundary. If any of them
throws, the active session (whichever phase it is in) is aborted the same way container/composable
disposal cleans up — deterministically and immediately, before the error is rethrown unchanged: no
rollback is attempted, and `onDragEnd` is not called for that aborted session. The exact-one-
`onDragEnd` guarantee above applies to sessions whose consumer getter/callback calls do not throw.
If the original pointer may still be physically held and the container is still mounted, the
bounded release watcher is armed exactly as an ordinary early cancellation would arm it. If
`onDragEnd` itself throws, every other effect has already been cleaned up beforehand; the error
still propagates unchanged.

## Profiling

Storybook provides `ReorderProfilingHarness` stories with 100, 500, and 1000 items. They use the
public API, cached computed keys, and synchronous controlled updates for reproducible DevTools
profiling during production-consumer migration. They are manual diagnostic surfaces, not visual
baselines or CI performance benchmarks; do not add timing thresholds or infer device performance
from CI runtime.

## Non-goals

This library does not provide: consumer migration, cross-container transfer, nested containers,
keyboard reordering, accessibility announcements, virtualized-list adapters, visual dragged
layers/overlays/clones, persistence, domain-specific list behavior, or configurable layout
direction/autoscroll strategy.