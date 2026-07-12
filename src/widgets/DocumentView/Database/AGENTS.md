# src/widgets/DocumentView/Database

Inherits the rules from `src/widgets/AGENTS.md`. Applies to `src/widgets/DocumentView/Database` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Database document screen composition, inline value rendering, and view-level sheets or toolbars.

## Patterns

- Treat this directory as composition for database document UI, not as a domain layer.
- Pass document IDs, view IDs, and other narrow display inputs instead of large mutable document objects.
- Route inline edits and toolbar actions through entity or feature APIs rather than mutating document state directly.
- Keep value-type-specific render, edit, and property-settings branching centralized in dedicated widget composition components rather than repeating `v-if` trees across sheets, filters, and inline surfaces.
- Use slots to pass those widget-level compositions into features instead of making features depend on widget internals.
- Prefer explicit props and named event handlers in these composition components; do not hide value-field contracts behind object-literal `v-bind` bags or anonymous inline callbacks.

## Anti-patterns

- Do not move sorting, filtering, validation, or CRUD rules into this widget layer.
- Do not depend on `shared/service` directly when entity or feature APIs already cover the flow.
- Do not place generic reusable UI here when it belongs in `shared/ui`.

## Constraints

- Changes here affect multiple property and value types at once.
- Minimum verification: run `pnpm verify --only type-check`, then open a database document, exercise the touched inline or sheet flow, and refresh or reopen the same view to confirm the rendered state still persists correctly. Use focused verify-managed browser coverage where available. Final completion still requires `pnpm verify`.
