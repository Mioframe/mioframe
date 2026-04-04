# src/widgets/DocumentView/Database

Inherits the rules from `src/widgets/DocumentView/AGENTS.md`. Applies to `src/widgets/DocumentView/Database` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DatabaseViewWidget.vue`: the main database document view container.
- `DatabaseToolbar.vue`: view-level toolbar actions.
- `DatabaseViewLayout.vue`: table layout and slot composition.
- `DatabasePropertiesSheet.vue`, `DatabaseViewsSheet.vue`, `DatabaseSortSheet.vue`, `DatabaseFiltersSheet.vue`: supporting sheets and panels.
- `ValueField.vue`, `ValueInline.vue`, `EditableInlineValue.vue`: value rendering and inline editing composition.
- `PropertyCreateDialogWidget.vue`: create-property flow wiring.

## Patterns

- Treat this directory as composition for database document UI, not as a domain layer.
- Pass IDs, refs, and narrow props downward instead of large mutable domain objects.
- Inline editing should call feature/entity APIs instead of mutating document state directly.
- Slot-based rendering is appropriate when it reduces coupling between value types and layout.

## Anti-patterns

- Do not move sorting, filtering, schema validation, or CRUD rules into this widget layer.
- Do not depend on `shared/service` directly when entity or feature APIs already cover the flow.
- Do not place generic reusable UI here; that belongs in `shared/ui`.
- Do not keep standalone dialogs here if they are really self-contained features.

## Constraints

- Changes in `ValueField.vue` and inline edit paths affect multiple property/value types.
- Composition changes here must be checked against create, edit, filter, and sort flows in database document view.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected database document flow.
