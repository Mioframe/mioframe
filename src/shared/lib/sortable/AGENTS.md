# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `useSortable.ts`: main sortable composable.
- `useDragStartListener.ts`: pointer and drag lifecycle helpers.
- `dnd-transition.css`: transition styles.
- `UseSortablePlayground.vue`: behavior playground.

## Patterns

- Keep the drag-and-drop algorithm independent from any business-specific persistence flow.
- Treat pointer lifecycle as a full contract: start, over, drop, cancel, and cleanup.
- Keep reorder behavior predictable on large lists and under frequent updates.

## Anti-patterns

- Do not depend on incidental DOM assumptions when refs and explicit container contracts are enough.
- Do not mix persistence logic from one feature into the generic sortable algorithm.
- Do not change reorder behavior without checking high-frequency hover/update scenarios.

## Constraints

- Changes here should be checked on long lists and under frequent pointer events.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual or test smoke check of the touched drag-and-drop flow.
