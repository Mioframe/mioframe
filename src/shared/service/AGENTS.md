# src/shared/service KNOWLEDGE BASE

## OVERVIEW
Data synchronization, file system coordination, and external API services.

## STRUCTURE
```
src/shared/service/
├── databaseDocument/ # DB operations, view sync
├── directories/      # Directory management
├── fileSystem/       # FS operations (read/write docs)
└── google/           # Drive sync APIs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Saving/Loading docs | `fileSystem/` | Document I/O |
| DB modifications | `databaseDocument/` | Adding/removing properties, views |

## CONVENTIONS
- Services act as the orchestrator between `lib` utilities and the UI components.
- Often provide Vue reactive state or composables wrapper around vanilla TS libs.

## ANTI-PATTERNS
- **NEVER** inject UI components into the service layer.
- **NEVER** bypass error boundaries when making remote or FS calls.