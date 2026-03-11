# src/pages KNOWLEDGE BASE

## OVERVIEW
Page components and routing setup. Custom stack navigation with multi-pane layout. Each page acts as pane in stack.

## STRUCTURE
```
src/pages/
├── routes.ts                    # Main route configuration
├── SplitView/                   # Stack navigation implementation
│   ├── SplitView.vue            # Multi-pane layout component
│   ├── definePane.ts            # Pane definition helper
│   └── defineStackNavigation.ts # Navigation stack manager
├── HomePane/                    # Home screen
├── RepoExplorer/                # Repository/file browser
├── DocumentViewPane/            # Document view (database, json)
├── Settings/                    # App settings
└── Account/                     # User account management
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Route setup | `routes.ts` | Stack navigation configuration |
| Pane definition | `SplitView/definePane.ts` | How pages become panes |
| Custom navigation | `SplitView/defineStackNavigation.ts` | Stack-based routing logic |
| Document view | `DocumentViewPane/` | Database document rendering |
| File browser | `RepoExplorer/` | Repository file tree |

## CONVENTIONS
- Define pages as panes via `definePane()`.
- Export pane config from `index.ts` in each page folder.
- Use `model.ts` for Zod query validation.
- Pass props through URL query as serialized JSON.
- Use hash-based navigation.

## ANTI-PATTERNS
- **NEVER** use standard Vue Router routes directly.
- **NEVER** bypass pane system for navigation.
- **NEVER** pass complex objects in route params. Use query serialization instead.
