# src/widgets/DocumentView/Database

Inherits the rules from `src/widgets/AGENTS.md`. Applies to `src/widgets/DocumentView/Database` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Database document screen composition, inline value rendering, and view-level sheets or toolbars.

## Patterns

- Treat this directory as composition for database document UI, not as a domain layer.
- Pass document IDs, view IDs, and other narrow display inputs instead of large mutable document objects.
- Route inline edits and toolbar actions through entity or feature APIs rather than mutating document state directly.
- Use slots or small render helpers to connect value-type-specific UI to the shared layout without baking schema rules into the widget layer.

## Anti-patterns

- Do not move sorting, filtering, validation, or CRUD rules into this widget layer.
- Do not depend on `shared/service` directly when entity or feature APIs already cover the flow.
- Do not place generic reusable UI here when it belongs in `shared/ui`.

## Constraints

- Changes here affect multiple property and value types at once.
- Minimum verification: `pnpm type-check`, then open a database document, exercise the touched inline or sheet flow, and refresh or reopen the same view to confirm the rendered state still persists correctly.
