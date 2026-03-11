# src/entities KNOWLEDGE BASE

## OVERVIEW
Domain models, database structures, and business logic. Defines the "what" of the application. Provides data structures and minimal UI for rendering.

## STRUCTURE
```
src/entities/
├── cfrDocument/          # CRDT Document schema and list items
├── database*/            # Database entities (Item, Property, View, etc.)
│   ├── databaseItem/     # Data records
│   ├── databaseProperty/ # Column definitions
│   ├── databaseView/     # Presentation (table, sorting, filtering)
│   └── ...               # Property types (Boolean, Date, Relation)
├── fsEntry/              # File system entry models
├── gProfile/             # User profile
├── localSettings/        # App configuration
├── mountedDirectories/   # OPFS directory management
└── repository/           # Repository structures
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Database Operations | `database*/use*.ts` | CRUD via `useMainServiceClient` |
| Validation Schemas | `@shared/lib/databaseDocument` | Zod schemas for DB entities |
| Property Logic | `databaseProperty/` | Core property management |
| View Logic | `databaseView/` | Sorting, filtering, layouts |
| Document Logic | `cfrDocument/` | CRDT document management |

## CONVENTIONS
- **FSD**: Entities only import from `shared`.
- **Data**: Use `useQuery` and `useMainServiceClient` for state.
- **Naming**: `use[EntityName]` or `use[EntityName]s` for composables.
- **UI**: Minimal, logic-less components (`*Span.vue`, `*ListItem.vue`).
- **Typing**: Use `@shared/lib/databaseDocument` or `@shared/lib/automerge`.

## ANTI-PATTERNS
- **NEVER** import from `features/`, `widgets/`, or `pages/`.
- **NEVER** handle complex interactions (use `features/`).
- **NEVER** bypass composables for data access.
- **NEVER** hardcode types or layouts (use constants).
