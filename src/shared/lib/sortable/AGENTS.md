# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` refines it.

## Status

Legacy. `@shared/lib/reorder` is the canonical reorder implementation; this module is retained
only for its remaining unmigrated production consumer (`DatabaseItemSortingListSection.vue`). Do
not add new consumers or features here — migrate to `@shared/lib/reorder` instead.

## Contains

- Generic reorder surfaces, SortableJS integration, gesture profiling, and Storybook story or focused test support.

## Patterns

- Keep the reorder contract independent from business persistence and item shape.
- Treat active input mode as runtime data rather than a hardcoded platform assumption.
- Preserve predictable behavior under external list updates, cancel flows, and post-drag click suppression.

## Anti-patterns

- Do not couple reorder internals to one surface type such as lists or tables.
- Do not mix feature-specific persistence logic into the generic reorder implementation.
- Do not change hybrid-input behavior without tests.

## Constraints

- Reorder changes are user-visible on touch, mouse, and hybrid devices.
- Minimum verification: run `pnpm verify --only type-check`, then run focused verify-managed sortable tests for the touched logic and verify the affected surface on both touch-style and mouse-style input. Final completion still requires `pnpm verify`.
