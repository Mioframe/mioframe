# src/shared/lib/databaseDocument KNOWLEDGE BASE

## OVERVIEW
Database document schema definitions, migrations, and type definitions. Core library for database document structure.

## STRUCTURE
```
src/shared/lib/databaseDocument/
├── index.ts              # Main exports
├── types.ts             # DatabaseDocument, MutationFn types
├── databaseDocument.ts  # DATABASE_DOCUMENT_TYPE constant
├── migrations/          # Version migrations
│   ├── index.ts
│   ├── defineMigrations.ts
│   ├── defineVersion.ts
│   └── versions/       # Version-specific schemas
│       └── v1/         # Current version
│           ├── property/  # Property schemas
│           ├── item/      # Item schemas
│           └── view/     # View schemas
└── migrations/          # Migration system
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Document types | `types.ts` | DatabaseDocument, DatabaseDocumentWithContent |
| Migrations | `migrations/` | Version upgrade logic |
| Property types | `migrations/versions/v1/property/` | Property Zod schemas |
| View layouts | `@shared/lib/databaseDocument` | DB_VIEW_LAYOUT enum |
| Filter operators | `@shared/lib/databaseDocument` | FILTER_OPERATOR enums |

## CONVENTIONS
- Document type constant:
  ```typescript
  export const DATABASE_DOCUMENT_TYPE = 'database';
  ```
- Zod schema composition:
  ```typescript
  export const zodDatabaseDocumentWithContent = extend(
    zodDatabaseTypeDocument,
    partial(zodDatabaseExtensionBodyDocument).shape
  );
  ```
- Migration system with version definitions
- Property types: string, number, boolean, date, relation

## ANTI-PATTERNS
- **NEVER** access document without migrations
- **NEVER** skip migration for schema changes
- **NEVER** use raw objects (use Zod schemas)
