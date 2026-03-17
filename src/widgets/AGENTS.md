# src/widgets - Widget Layer

**Scope:** Cross-layer compositions. Bridges `features` + `entities` → UI. 12 files.

## STRUCTURE

```
src/widgets/
└── DocumentView/
    └── Database/
        └── ValueField.vue
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Cross-feature composition | `DocumentView/` | Database document rendering |
| ValueField | `DocumentView/Database/` | Field value rendering |

## ANTI-PATTERNS
- **NEVER** import from `widgets/` in `features/` (FSD violation)
- **NEVER** import from `widgets/` in `entities/`
- **Use composition** instead of widget imports where possible

## DEPRECATED
- Legacy widget patterns - prefer composition
