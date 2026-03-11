# src/features KNOWLEDGE BASE

## OVERVIEW
User interactions, specific feature operations, and focused business logic.

## STRUCTURE
```
src/features/
├── database*Edit/    # Property editing (Filter, Item, View, Boolean, Date)
├── document*/        # Document creation, rename, remove
├── entry*/           # Directory entry manipulations
└── exportDocument/   # Export capabilities
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Database filters | `databaseFilterEdit/` | Filter creation and logic |
| View manipulations | `databaseViewCreate/`, `databaseViewRename/` | Modifying data views |
| Filesystem actions | `localDirectoryPick/`, `permanentStorageRequest/` | Browser FS interactions |

## CONVENTIONS
- Each feature directory represents a distinct user capability.
- Components here compose UI elements from `shared/ui` and bind them to actions.
- Features should expose a public API via their `index.ts`.

## ANTI-PATTERNS
- **NEVER** import from other `features/` (cross-feature imports violate FSD).
- **NEVER** define shared domain logic here (put it in `entities/`).