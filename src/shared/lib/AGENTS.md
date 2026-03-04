# src/shared/lib KNOWLEDGE BASE

## OVERVIEW
Core utilities, CRDT (Automerge) adapters, OPFS filesystem abstractions, and Google Drive integrations.

## STRUCTURE
```
src/shared/lib/
├── automerge/         # CRDT logic and types
├── automergeAdapter/  # Integration of Automerge with Vue
├── databaseDocument/  # DB sync and migrations
├── virtualFileSystem/ # File system abstractions (OPFS)
├── fileSystem/        # FS types and guards
└── playground/        # Developer utilities and test beds
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Document Migrations | `databaseDocument/migrations/` | Versioning for CRDT structures |
| File System Logic | `virtualFileSystem/` & `localFileSystem/` | OPFS API usage and fallback |
| CRDT Sync | `automergeAdapter/` | Data synchronization with UI |

## CONVENTIONS
- Pure TypeScript, minimal Vue reactivity where possible (isolated to adapters).
- Heavy use of TypeScript utility types and type guards (`src/shared/lib/typeGuards`).
- Errors are explicitly typed and thrown.

## ANTI-PATTERNS
- **NEVER** import from `features`, `widgets`, or `pages` (strict FSD layer violation).
- **NEVER** mutate CRDT documents without using the proper Automerge adapter mechanisms.