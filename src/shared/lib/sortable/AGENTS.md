# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- The geometry-based reorder engine: pointer/touch session handling, rect geometry, the lifted overlay, reorder directives, and playground or test support.

## Patterns

- Keep the reorder contract independent from business persistence and item shape.
- Treat active input mode as runtime data rather than a hardcoded platform assumption.
- Keep geometry logic pure and rect-driven so future non-vertical collections do not require public API changes.
- Preserve predictable behavior under external list updates, cancel flows, and post-drag click suppression.

## Anti-patterns

- Do not couple reorder internals to one surface type such as lists or tables.
- Do not mix feature-specific persistence logic into the generic reorder implementation.
- Do not reintroduce browser drag-and-drop semantics: no native drag image, no visible ghost/placeholder, no cursor-following clone.
- Do not expand the public consumer API with engine tuning options such as activation modes, interactive strategies, or layout hints.
- Do not change hybrid-input behavior without tests.

## Constraints

- Reorder changes are user-visible on touch, mouse, and hybrid devices.
- Minimum verification: `pnpm type-check`, then run focused sortable tests for the touched logic and verify the affected surface on both touch-style and mouse-style input.
