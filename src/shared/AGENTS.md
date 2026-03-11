# src/shared KNOWLEDGE BASE

## OVERVIEW
Foundation layer. Domain-agnostic. Provides reusable UI, low-level utilities, and core services. Lowest FSD tier.

## STRUCTURE
```
src/shared/
├── lib/      # Low-level utilities, CRDT (Automerge), FS adapters
├── service/  # Orchestration services, DB management, sync logic
└── ui/       # Generic UI components, layouts, design system
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| UI Components | `ui/` | Buttons, Dialogs, Tables, Inputs |
| CRDT / Automerge | `lib/automerge/` | Data consistency and sync |
| File System | `lib/virtualFileSystem/` | OPFS and local storage |
| DB Services | `service/databaseDocument/` | Document and view management |

## CONVENTIONS
- Domain-agnostic only. No business logic in UI.
- Strict TypeScript. No `any`.
- Services bridge `lib` and UI.
- Scoped CSS/Modules for UI components.

## ANTI-PATTERNS
- **NEVER** import from `entities`, `features`, `widgets`, or `pages`.
- **NEVER** include domain-specific models in `ui/`.
- **NEVER** put UI logic in `service/`.
- **NEVER** bypass `lib` abstractions for direct FS/API access.
