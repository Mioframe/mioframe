# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `reorderDirectives.ts`: local directives for marking reorder items and ignored controls.
- `useReorderSurface.ts`: public reorder-surface composable.
- `sortableAdapter.ts`: `SortableJS` adapter and lifecycle wiring.
- `reorderGestureProfile.ts`: platform/input gesture profile selection.
- `ReorderSurfacePlayground.vue`: behavior playground.

## Patterns

- Keep the reorder contract independent from business persistence and item shape.
- Treat platform and active input as runtime data, not as hardcoded one-platform assumptions.
- Keep reorder behavior predictable under optimistic UI, external list updates, and cancel flows.

## Anti-patterns

- Do not couple reorder internals to one surface type such as lists or tables.
- Do not mix persistence logic from one feature into the generic reorder algorithm.
- Do not change session or profile behavior without checking hybrid devices and touch/mouse conflicts.

## Constraints

- Changes here should be checked on long lists, hybrid inputs, and under frequent pointer events.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual or test smoke check of the touched reorder flow.
