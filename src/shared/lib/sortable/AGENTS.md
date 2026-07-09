# src/shared/lib/sortable

Inherits the rules from `src/shared/lib/AGENTS.md`. Applies to `src/shared/lib/sortable` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- The Vue-reactive reorder primitive: pointer/touch session handling, rect geometry, optimistic display order, container-local auto-scroll, reorder directives, playground support, and focused tests.

## Patterns

- Use `REACTIVE_REORDER_HANDOFF.md` as the architecture contract for the PR 138 reorder rewrite.
- Keep the reorder contract independent from business persistence and item shape.
- Treat active input mode as runtime data rather than a hardcoded platform assumption.
- Keep geometry logic pure and rect-driven for the supported vertical-list production scenario.
- Preserve predictable behavior under external list updates, cancel flows, commit failures, auto-scroll, and post-drag click suppression.
- Keep consumer API narrow: `useReorderSurface`, `v-reorder-item`, and `v-reorder-ignore`.

## Anti-patterns

- Do not couple reorder internals to feature-specific persistence or business behavior.
- Do not mix feature-specific persistence logic into the generic reorder implementation.
- Do not reintroduce browser drag-and-drop semantics: no native drag image, no DOM snapshot clone, no overlay, no visible ghost, and no cursor-following clone.
- Do not expand the public consumer API with engine tuning options such as activation modes, interactive strategies, layout hints, render callbacks, or scroll containers.
- Do not move reorder behavior into `shared/ui/Lists` or `MDListItem`.
- Do not change hybrid-input behavior without tests.

## Constraints

- Reorder changes are user-visible on touch, mouse, and hybrid devices.
- Minimum verification: `pnpm type-check`, then run focused sortable tests for the touched logic and verify the affected surface on both touch-style and mouse-style input.
