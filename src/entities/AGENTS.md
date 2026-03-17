# src/entities - Domain Models

**Scope:** Domain models, database structures, and business logic. Defines the "what" of the application. 68 files across database entities, property types, and repository structures.

## CRITICAL WARNINGS

### FSD Violation
- **databaseFilterEdit/DatabaseQueryFilterForm.vue** (line 23-24): Imports directly from `@widget/DocumentView/Database/ValueField.vue`
- **Action**: Remove widget import; use composition or move logic to `shared/`

### TypeScript `any` Usage
- 8 instances across 6 files - violates strict TypeScript requirement
- Must replace with proper generics or `unknown`

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
| Property Types | `databaseProperty/` | Boolean, Date, Relation, String types |

## CONVENTIONS
- **FSD**: Entities only import from `shared`.
- **Data**: Use `useQuery` and `useMainServiceClient` for state.
- **Naming**: `use[EntityName]` or `use[EntityName]s` for composables.
- **UI**: Minimal, logic-less components (`*Span.vue`, `*ListItem.vue`).
- **Typing**: Use `@shared/lib/databaseDocument` or `@shared/lib/automerge`.
- **Zod Schemas**: Defined in `@shared/lib/databaseDocument` for validation.

## ANTI-PATTERNS
- **NEVER** import from `features/`, `widgets/`, or `pages/`.
- **NEVER** handle complex interactions (use `features/`).
- **NEVER** bypass composables for data access.
- **NEVER** hardcode types or layouts (use constants).
- **NEVER** use `any` type - use proper generics or `unknown`.

## ENTITY MODULES

### cfrDocument/
CRDT document handling. Manages database documents using Automerge.
- `useDocument(path, documentId)`: Returns document state, put/patch methods
- `DatabaseDocumentSelectOption.vue`: Select option component for document lists
- **CRDT**: Documents are CRDT-aware; mutations go through `put`/`patch`

### databaseItem/
Data record management. CRUD operations for database items.
- `useDatabaseItem(path, documentId, itemId)`: Fetches single item
- Returns `{ item, isLoading, errorMessage, postItem }`
- Types: `DatabaseItem`, `DatabaseItemId` from `@shared/lib/databaseDocument`

### databaseProperty/
Column definitions. Defines properties (name, type, default values).
- `useDatabaseProperties(path, documentId)`: List of all properties
- `useDatabaseProperty(path, documentId, propertyId)`: Single property with patch
- **Types**: String, Number, Boolean, Date, Relation (defined as constants)
- **Schemas**: Zod schemas in `@shared/lib/databaseDocument`

### databaseView/
Presentation layer. Defines table layout, sorting, filtering.
- `useDatabaseViews(path, documentId)`: List of all views for document
- `useDatabaseView(path, documentId, viewId)`: Single view with patch
- **Layouts**: `DB_VIEW_LAYOUT.TABLE`, etc.
- `patch(view)`: Updates view configuration (sorting, name)

### database[Type]/
Property type implementations. Specialized handling for each property type.
- `databaseString/`, `databaseNumber/`, `databaseBoolean/`, `databaseDate/`
- `databaseRelation/`: Handles relations to other records
- `databaseFilter/`: Filter definitions for views
- `databaseValue/`: Value rendering logic
- `databaseSorting/`: Sort descriptions and logic

### fsEntry/
File system entry models. OPFS node statistics and information.
- `useFSNodeStat(path)`: Returns node stat data, error, loading state
- `FSEntryMDListItem.vue`: List item renderer
- Service: `fsNodeStat` from `@shared/service/fileSystem`

### repository/
Repository (folder/directory) management. Lists and creates documents.
- `useRepository(path)`: Returns document ID list, create/delete methods
- `createDocument(initialValue)`: Creates new CFR document
- `deleteDocument(id)`: Removes document by ID
- Types: `CFRDocumentContent`, `AMDocumentId` from `@shared/lib/cfrDocument`

### mountedDirectories/
OPFS directory management. Mounts and manages user directories.
- `useFileSystem`: Global state for file system operations
- **Operations**: `mountUserDirectory`, `createDirectory`, `move`, `remove`, `unmount`
- **API**: `directoryContent`, `showDirectoryPicker` support check
- Uses `useMainServiceClient().fileSystem` methods

### gProfile/
Google user profile. Fetches and caches user information.
- `useGProfile()`: Returns user info, profile image blob URL
- **Async**: Uses `computedAsync` for Google API calls
- **Image**: Fetches profile picture via `ky` GET request
- Service: `oauth2.userinfo.get` with access token

### localSettings/
App configuration. Persistent settings stored in IndexedDB.
- `useLocalSettings()`: Returns settings object with descriptions/labels
- **Settings**: `showPerformance`, `showAutomergeFiles`, `panesWidth`
- **Storage**: `useIDBKeyval` with Zod serialization
- Schema: `zodSettingsStorage` in module

## CRDT DOCUMENT STRUCTURE
```
CFR Document
├── type: DATABASE_DOCUMENT_TYPE ('database')
├── properties: Array<DatabaseProperty>
│   ├── id: DatabasePropertyId
│   ├── name: string
│   ├── type: PropertyType (STRING, NUMBER, BOOLEAN, DATE, RELATION)
│   └── defaultValue: optional
├── items: Array<DatabaseItem>
│   ├── id: DatabaseItemId
│   └── properties: Record<DatabasePropertyId, PropertyValue>
└── views: Array<DatabaseView>
    ├── id: DatabaseViewId
    ├── name: string
    ├── layout: DB_VIEW_LAYOUT
    ├── columns: Array<DatabasePropertyId>
    ├── sort: [PropertyId, Direction]
    └── filters: Array<DatabaseFilter>
```

## COMPOSABLE PATTERN
```typescript
// Standard entity composable
const { data, errorMessage, isLoading, create, update, delete } = useEntity(
  pathRef,              // Ref<string>
  documentIdRef,        // Ref<AMDocumentId | undefined>
  entityRef?            // Ref<EntityId | undefined>
);

// Returns
{
  data: Ref<Entity | undefined>,
  errorMessage: Computed<string | undefined>,
  isLoading: Ref<boolean>,
  [action]: (params) => Promise<void>
}
```

## CRDT RULES
- **NEVER** mutate document state directly (breaks CRDT)
- **ALWAYS** use `put`/`patch` from composable
- **ALWAYS** handle `DomainError` from service layer
- **ALWAYS** use `useQuery` for reactive data fetching
- **NEVER** skip error handling for mutations

## TYPE SAFETY
```typescript
// Use shared types
import type { DatabaseItem, DatabaseProperty } from '@shared/lib/databaseDocument';

// Use proper generics
function processItem<T extends DatabaseItem>(item: T): T { ... }

// Use unknown for dynamic
function handleValue(value: unknown): void { ... }
```
