# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Generic reorder surfaces, SortableJS integration, gesture profiling, and playground or test support.

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
- Minimum verification: `pnpm type-check`, then run focused sortable tests for the touched logic and verify the affected surface on both touch-style and mouse-style input.
