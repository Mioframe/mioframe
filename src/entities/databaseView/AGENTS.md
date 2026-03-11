# src/entities/databaseView KNOWLEDGE BASE

## OVERVIEW
Database view management. Views define how data is displayed (table layout, sorting, filtering). Multiple views per database document allow different presentations of the same data.

## STRUCTURE
```
src/entities/databaseView/
├── index.ts             # Exports: DatabaseViewChipsList, useDatabaseViews, useDatabaseView
├── useDatabaseViews.ts  # List of all views for a document
├── useDatabaseView.ts   # Single view by ID
└── DatabaseViewChipsList.vue  # View selector chips
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| View list | `useDatabaseViews.ts` | Fetches all views for doc |
| Single view | `useDatabaseView.ts` | Fetches view by ID with patch |
| View service | `@shared/service/databaseDocument/view` | CRUD operations |
| View types | `@shared/lib/databaseDocument` | DatabaseView, DB_VIEW_LAYOUT |

## CONVENTIONS
- Views composable:
  ```typescript
  const { views: databaseViewList } = useDatabaseViews(path, documentId);
  ```
- Single view with mutation:
  ```typescript
  const { view, errorMessage, isLoading, patch } = useDatabaseView(
    path, documentId, viewId
  );
  ```
- View layouts: `DB_VIEW_LAYOUT.TABLE`, etc.
- `patch(view)` updates view configuration (sorting, name, etc.)

## ANTI-PATTERNS
- **NEVER** access views without using composables
- **NEVER** mutate view objects directly (use patch)
- **NEVER** skip error handling for view operations
