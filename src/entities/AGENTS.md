# src/entities KNOWLEDGE BASE

## OVERVIEW
Domain models, database structures, and business logic definitions.

## STRUCTURE
```
src/entities/
├── cfrDocument/      # CRDT Document schema
├── database*/        # Database item, property, relation schemas
├── fsEntry/          # File system entry models
└── localSettings/    # Local app configuration
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Database Properties | `databaseProperty/`, `databaseNumber/` | Property definitions |
| View logic | `databaseView/`, `databaseSorting/` | View state definitions |

## CONVENTIONS
- Entities represent the "what" of the application (data structures).
- Provide minimal UI components that strictly render the entity (e.g., `DocumentMDListItem.vue`).
- Strongly typed Zod schemas or TypeScript interfaces for validation.

## ANTI-PATTERNS
- **NEVER** import from `features/`, `widgets/`, or `pages/`.
- **NEVER** handle complex user interactions here (use `features/` for that).