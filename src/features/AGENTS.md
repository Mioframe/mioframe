# src/features KNOWLEDGE BASE

## OVERVIEW
User actions and business logic units. Features connect entities to UI. They fulfill specific user goals: editing data, managing files, exporting content.

## STRUCTURE
```
src/features/
├── [featureName]/
│   ├── index.ts          # Public API. Exports components, composables, types.
│   ├── [Feature].vue     # Primary component. Usually a dialog, button, or form.
│   ├── model/            # Internal logic. Composables or state.
│   └── ui/               # Internal components.
├── *ValueEdit/           # Editors for specific property types (string, date, etc.).
├── database*/            # Database schema and item operations.
└── document*/            # Document lifecycle: create, rename, remove.
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Value editing | `*ValueEdit/` | Specialized fields for data types. |
| Item management | `databaseItem*/` | CRUD for database rows. |
| Schema changes | `databaseProperty*/` | Column management. |
| View control | `databaseView*/` | View configuration and sorting. |
| File operations | `document*/`, `directory*/` | Document and folder management. |
| System access | `localDirectoryPick/` | Browser directory selection. |

## CONVENTIONS
- Follow Feature-Sliced Design. Keep features independent.
- Export public API via `index.ts`.
- Compose `shared/ui` components.
- Use `entities/` for domain logic and data access.
- Use `defineModel` for reactive state in dialogs.
- Prefix components with feature name.

## ANTI-PATTERNS
- **NEVER** import from other features. Use `widgets/` for composition.
- **NEVER** store global state. Use `entities/` or `app/`.
- **NEVER** bypass `index.ts` when importing.
- **NEVER** add complex layout. Keep features focused on single actions.
