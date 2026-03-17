# src/pages - Page Layer

**Scope:** Page components and routing setup. Custom stack navigation with multi-pane layout. Each page acts as pane in stack. 19 files defining the app's navigation structure.

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
| Settings | `Settings/` | App configuration UI |
| Account | `Account/` | User account management |

## CONVENTIONS
- Define pages as panes via `definePane()`.
- Export pane config from `index.ts` in each page folder.
- Use `model.ts` for Zod query validation.
- Pass props through URL query as serialized JSON.
- Use hash-based navigation.
- **Zod Models**: Each page defines query schema in `model.ts`.

## ANTI-PATTERNS
- **NEVER** use standard Vue Router routes directly.
- **NEVER** bypass pane system for navigation.
- **NEVER** pass complex objects in route params. Use query serialization instead.
- **NEVER** use `any` type - use proper generics or `unknown`.

## NAVIGATION PATTERN
Pages are registered as panes:

```typescript
// SplitView/definePane.ts
export function definePane(config: PaneConfig) {
  // Registers page as stack pane
}

// Usage in page folder
export default definePane({
  title: 'Document View',
  component: () => import('./DocumentViewPane/DocumentViewPane.vue'),
  model: () => import('./model.ts'),
})
```

## ROUTING FLOW
1. `routes.ts` defines stack configuration
2. `SplitView.vue` renders multi-pane layout
3. `defineStackNavigation.ts` manages navigation state
4. Pages registered as panes via `definePane()`

## DEPRECATED
- Legacy routing patterns - use pane system exclusively
