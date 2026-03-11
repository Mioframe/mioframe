# src/features/databasePropertyCreate KNOWLEDGE BASE

## OVERVIEW
Feature for creating new database properties. Handles property type selection, name input, and default value configuration.

## STRUCTURE
```
src/features/databasePropertyCreate/
├── index.ts                                    # Exports: DatabasePropertyCreationDialog
├── DatabasePropertyCreationDialog.vue          # Main creation dialog
└── DatabasePropertyCreationDialogPlayground.vue  # Development playground
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Property types | `@entity/databaseString`, `databaseNumber`, etc. | Type constants |
| Property creation | `@entity/databaseProperty/useDatabaseProperties` | post function |
| Property schema | `@shared/lib/databaseDocument` | Zod validation |

## CONVENTIONS
- Dialog component with defineModel:
  ```typescript
  const showModel = defineModel<boolean>('show', { required: true });
  const props = defineProps<{ path: string; documentId: AMDocumentId }>();
  const emit = defineEmits<{ created: [id: DatabasePropertyId]; cancel: [] }>();
  ```
- Uses Zod validation with zodIs:
  ```typescript
  const assembledProperty = computed(() => 
    zodIs(partialPropertyState.value, zodDatabaseUnknownProperty)
      ? partialPropertyState.value : undefined
  );
  ```
- Property types: PROPERTY_TYPE_STRING, NUMBER, BOOLEAN, DATE, RELATION
- Uses useSnackbar for user feedback

## ANTI-PATTERNS
- **NEVER** skip Zod validation before creating property
- **NEVER** use arbitrary property types (use constants)
- **NEVER** skip error handling (use addSnackbar)
