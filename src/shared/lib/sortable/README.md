# sortable

Generic reorder primitives for Vue surfaces.

This module is the shared drag-to-reorder layer used by feature and entity UIs.
It is a `shared/lib` interaction primitive, not a Material List feature:
`MDListItem` and the rest of `shared/ui/Lists` have no sortable/reorder
knowledge, and reorder behavior must be composed by the consumer (usually a
feature) around the shared list UI, never inside it.

The module does not know anything about database views, sorting rules, or any
other business data. Its contract is simple:

- the caller provides a stable ordered list of string ids;
- the library renders and previews reorder sessions against those ids;
- the caller persists the new order in `onCommit`.

## Public API

Import through `index.ts`.

### `useReorderSurface(container, options)`

High-level composable for reorderable surfaces.

Inputs:

- `itemIdList`: the authoritative external order.
- `layout`: optional, defaults to `'vertical'`.
- `activation`: optional, defaults to `'immediate'`. `'fullRowNative'` allows drag to
  start from anywhere on the row itself, gated by input (long press on touch/pen,
  intentional movement on mouse).
- `density`: optional, defaults to `'comfortable'`.
- `disabled`: disables reordering.
- `interactiveSelector`: selector for controls that should not start drag. Only
  consulted under `interactiveStrategy: 'blockInteractiveDescendants'`.
- `interactiveStrategy`: optional, defaults to `'blockInteractiveDescendants'`.
  `'explicitIgnoreOnly'` blocks drag only inside explicit `v-reorder-ignore` zones, so a
  row's own primary action (button/link) does not block drag. Required alongside
  `activation: 'fullRowNative'`.
- `scrollContainer`: optional scroll target for auto-scroll.
- `onCommit`: async or sync persistence callback.

### Production Material-list recipe (full-row native reorder)

Every production reorderable `MDListItem` surface must use this exact
configuration. The two options are a required pair, not independent knobs:

```ts
useReorderSurface(container, {
  itemIdList,
  activation: 'fullRowNative',
  interactiveStrategy: 'explicitIgnoreOnly',
  onCommit: ({ orderedIds }) => persistOrder(orderedIds),
});
```

Consumer responsibilities:

- put `v-reorder-item="id"` on each reorderable row host (the `MDListItem`
  itself or the wrapper component that renders it);
- mark trailing actions, menus, delete buttons, inputs, and every other
  control that must stay clickable without starting drag with
  `v-reorder-ignore`;
- keep row click/tap behavior owned by the feature — pass the dragged fact
  down through the row's explicit `dragged` prop and commit persistence
  through the owning entity API in `onCommit`.

Under `explicitIgnoreOnly`, explicit `v-reorder-ignore` zones are the only
thing that blocks drag — the row's own primary action, even when it is a
full-width button or link, does not.

**Misconfiguration warning.** `activation: 'fullRowNative'` without
`interactiveStrategy: 'explicitIgnoreOnly'` is wrong for `MDListItem` row
consumers: the default `'blockInteractiveDescendants'` strategy treats the
row's full-width primary action (a native button or link) as an interactive
descendant, so drag activation is blocked on the entire row and full-row drag
silently never starts. If you use `fullRowNative`, pair it with
`explicitIgnoreOnly` and take over ignore-zone marking yourself.
`useReorderSurface` logs a dev-mode `console.warn` for this combination
(see `isReorderFullRowNativeMisconfigured`), but the pairing is still the
consumer's responsibility in production builds.

Outputs:

- `displayItemIdList`: local display order used during drag preview and optimistic UI.
- `draggedId`: the id currently being dragged.
- `isDragging`: whether a drag is active.
- `isReorderSession`: alias for drag session state.
- `activeProfile`: resolved runtime input profile.
- `suppressNextClick`: whether the next synthetic click is being suppressed.
- `cancel()`: requests rollback of the active drag session.

### `vReorderItem`

Marks an element or component root as a reorderable item and assigns its stable
id through `data-sortable-id`.

Component-root usage is a supported contract: when the directive is placed on a
component, Vue forwards it through single-root component levels to the actual
rendered root element, so `v-reorder-item` also works on a wrapper component
whose root is another component that ultimately renders one `HTMLElement` root
(for example a feature row component wrapping `MDListItem`). Consumers never
need to know or reach into the child component's internal DOM to mark sortable
rows. The one requirement is that the component keeps a stable single
`HTMLElement` root; a dev-mode warning fires when it does not
(`reorderDirectives.ts`), and `reorderDirectives.test.ts` covers the nested
component-root case.

### `vReorderIgnore`

Marks a subtree as non-draggable through `data-sortable-ignore`. Use this on
buttons, menu triggers, delete actions, and other controls that should stay
clickable without starting drag.

## Drag Visual Policy

Drag-state visuals are owned by this module (`reorderSurface.css`), not by
shared Material list components: `MDListItem` styles its Material `dragged`
state through its public `dragged` prop and knows nothing about SortableJS.

SortableJS always runs in forced-fallback mode here, so an active session
renders two elements, styled through the class names in `constants.ts`:

- `reorder-item_chosen`: the pressed/lifting original row. Raised with
  `position: relative; z-index` so consumer-supplied elevation (for example the
  Material dragged shadow) paints above adjacent rows instead of under them.
- `reorder-item_ghost`: the original row while it previews the drop position
  inside the list. Rendered as an invisible slot (`opacity: 0`, still
  hit-testable) so it reads as a gap, not as a duplicate placeholder row.
- `reorder-item_fallback` + `reorder-item_drag`: the pointer-following clone,
  mounted on `<body>` (`fallbackOnBody`). Because it is cloned outside its
  list, it gets an explicit surface fill, dragged elevation, and shape from
  `reorderSurface.css` (Material system tokens with neutral fallbacks).
  SortableJS pins inline `opacity: 0.8` on it; that translucency is accepted
  rather than overridden with `!important`.

Consumers must not restyle these classes per feature; if a surface needs a
different drag look, change the shared policy here.

## Typical Integration

```vue
<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useReorderSurface, vReorderIgnore, vReorderItem } from '@shared/lib/sortable';

const container = useTemplateRef('container');
const itemIdList = computed(() => props.items.map((item) => item.id));

const { displayItemIdList, draggedId } = useReorderSurface(container, {
  itemIdList,
  onCommit: ({ orderedIds }) => persistOrder(orderedIds),
});
</script>

<template>
  <div ref="container">
    <RowComponent
      v-for="itemId in displayItemIdList"
      :key="itemId"
      v-reorder-item="itemId"
      :class="{ 'md-state_drag': draggedId === itemId }"
    >
      <button v-reorder-ignore type="button">delete</button>
    </RowComponent>
  </div>
</template>
```

## Why `displayItemIdList` Exists

The library intentionally does not mutate the caller's source list directly.

Reasons:

- business persistence belongs outside the generic reorder primitive;
- drag preview needs a temporary local order before persistence succeeds;
- optimistic UI should keep working even when external state updates arrive
  asynchronously;
- rollback and cancel flows must be able to restore the correct authoritative
  order.

`itemIdList` is the external source of truth.
`displayItemIdList` is the local render order for the current session.

## Internal Flow

### 1. Markup phase

- every draggable row gets `v-reorder-item="id"`;
- controls that should not start drag get `v-reorder-ignore`;
- `useReorderSurface` receives the same ordered ids through `itemIdList`.

### 2. Input and profile phase

- `useReorderSurface` tracks the most recent input type: pointer, touch, or pen;
- pen input is treated as touch-like input;
- `reorderGestureProfile.ts` resolves runtime behavior such as delay,
  threshold, scroll sensitivity, and animation;
- touch-like input can be upgraded from `immediate` to `longPress` to avoid
  accidental drags on dense mobile surfaces.

### 3. Adapter phase

- `sortableAdapter.ts` creates and owns the `SortableJS` instance;
- runtime options are updated when layout, profile, disabled state, or scroll
  target changes;
- the adapter emits generic `onStart`, `onChange`, and `onEnd` events with
  string ids, not business objects.

### 4. Session phase

During a drag session, `useReorderSurface.ts` keeps local session state:

- the dragged id;
- the order at drag start;
- the latest external order;
- the current optimistic order, if a commit is in flight.

This is what allows the library to separate drag preview from persistence.

### 5. Commit phase

When drag ends:

- unchanged order becomes a no-op;
- changed order updates `displayItemIdList` immediately;
- `onCommit` receives `orderedIds`, `movedId`, indices, and the runtime input
  profile.

The caller is responsible for persisting the new order and eventually emitting
the updated `itemIdList`.

## External Sync Rules

These rules explain the behavior that is easiest to miss when reading the code.

### External update during drag

If the external list changes while drag is active, the session is marked for
rollback. At drag end, the UI returns to the latest external order rather than
the stale order from drag start.

### Optimistic commit confirmation

If the external list later matches the optimistic order, the optimistic session
is considered confirmed and local optimistic state is cleared.

### Temporary old-order re-emission

If the external list temporarily re-emits the pre-drag order while the
optimistic commit is still pending, the library ignores that single rollback to
avoid visible flicker.

### Competing external reorder

If the external list emits a different order with the same set of ids, that
order is treated as authoritative. The UI follows it and any later rejection
from the older commit must not overwrite it.

## Current Consumers

- `src/features/databaseViewMapEdit/DatabaseViewListEdit.vue`: full-row native
  view reorder over `MDListItem` rows, committing through
  `useDatabaseViews().reorder`. Trailing action slot content is wrapped in a
  `v-reorder-ignore` host.
- `src/features/databaseItemSorting/DatabaseItemSortingListSection.vue`:
  full-row native sorting-property reorder, committing through
  `useDatabaseSorting().reorder`. The delete trailing action carries
  `v-reorder-ignore`.
- `ReorderSurfacePlayground.vue` (this module): dev/demo playground only. It
  may keep default activation/strategy options; it is not a production
  Material-list consumer and not a wiring reference for one — use the
  production recipe above instead.

## Verification Status

- Desktop full drag-completion (real mouse gesture, order change, post-drag
  click suppression) is covered by
  `tests/e2e/reorderSurfaceFullRowNative.spec.ts` and is active under the
  `github-actions` verify profile
  (`pnpm verify --profile github-actions --only e2e`).
- Desktop sorting-row drag-completion (component-root `v-reorder-item`
  consumer, order change, persistence across sheet reopen) is covered by the
  sorting-row test in the same spec, under the same `github-actions` profile
  gate.
- Mobile Chrome tap-select, trailing ignore-zone activation, and
  no-reorder-before-long-press are covered by active tests in the same spec.
- Mobile Chrome full long-press drag-completion is a known e2e **harness
  limitation**, not accepted product behavior: CDP touch synthesis arms the
  gesture but the fallback hit-testing step never commits an order change in
  the containerized headless Chromium. That scenario remains `test.fixme()`
  with the full rationale documented inline in the spec; engine-level
  long-press activation is covered by the real-SortableJS unit test in
  `sortableAdapter.test.ts`. Revisit with a real device or an improved touch
  harness.

## File Map

- `useReorderSurface.ts`: public composable, session state, DOM event wiring.
- `sortableAdapter.ts`: `SortableJS` bridge and lifecycle ownership.
- `reorderDirectives.ts`: item and ignore directives.
- `reorderGestureProfile.ts`: platform and input heuristics.
- `reorderInteractiveStrategy.ts`: resolves which descendants block drag activation.
- `reorderPostDragClick.ts`: synthetic click suppression rules after drag.
- `constants.ts`: shared attributes, class names, and selectors.
- `reorderSurface.css`: selection suppression and the drag visual policy
  (chosen/ghost/fallback styling).
- `ReorderSurfacePlayground.vue`: manual playground for behavior checks.
- `*.test.ts`: focused unit coverage for the touched invariants.

## Invariants

- Item ids must be stable, unique strings for the current surface.
- The library is generic over item shape; only ids cross the public contract.
- Business persistence must stay in `onCommit`, not inside shared reorder code.
- Import the module through `@shared/lib/sortable`.
