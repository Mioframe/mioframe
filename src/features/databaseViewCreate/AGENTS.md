# src/features/databaseViewCreate KNOWLEDGE BASE

## OVERVIEW
Feature for creating new database views. Handles view name input and layout type selection.

## STRUCTURE
```
src/features/databaseViewCreate/
├── index.ts                       # Exports: DatabaseViewCreateDialog, DatabaseViewAddForm
├── DatabaseViewCreateDialog.vue   # Main creation dialog
└── DatabaseViewAddForm.vue        # Form component (re-exported)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| View creation | `@entity/databaseView/useDatabaseViews` | create function |
| View layouts | `@shared/lib/databaseDocument` | DB_VIEW_LAYOUT enum |
| Select options | `@shared/ui/Select/defineSelectOptions` | Option definition helpers |

## CONVENTIONS
- Reactive form state with initialState:
  ```typescript
  const initialState = (): { layout: DB_VIEW_LAYOUT; name: string | undefined } => ({
    layout: DB_VIEW_LAYOUT.TABLE,
    name: undefined,
  });
  const formState = reactive(initialState());
  ```
- Loading state pattern (increment/decrement):
  ```typescript
  const loading = ref(0);
  loading.value += 1;
  try { await create({...}); }
  finally { loading.value -= 1; }
  ```
- Uses defineSelectOptions for MDSelect:
  ```typescript
  const layoutOptions = defineSelectOptions(
    objectEntries(DB_VIEW_LAYOUT).map(...)
  );
  ```
- defineModel for dialog visibility: `defineModel<boolean>('show', { required: true })`

## ANTI-PATTERNS
- **NEVER** create view without validating name exists
- **NEVER** use layout types without DB_VIEW_LAYOUT constants
- **NEVER** skip loading state for async operations
