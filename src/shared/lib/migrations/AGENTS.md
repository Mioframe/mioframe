# Migrations Library

## Overview

Version migration system for JSON data structures. Provides type-safe schema versioning and data transformation utilities for CRDT documents.

## Purpose

- Version JSON data structures with type safety
- Apply incremental transformations to upgrade data between versions
- Support for both "get latest data" and "apply update" patterns

## API

### defineMigrations

Creates migration application functions.

```typescript
import { defineMigrations } from '@shared/lib/migrations';

const migrations = defineMigrations(
  (v0) => { v0.version = 1; return v0; },  // мутирует на месте
  (v1) => ({ ...v1, version: 2 }),         // возвращает новый объект
  (v2) => ({ ...v2, version: 3 }),
);

// Мутирует original на месте до версии 3
const result = migrations.getLatestData({ name: 'test', version: 0 });
// original теперь: { name: 'test', version: 3 }
// result === original (тот же объект)
```

**Parameters:**
- Variadic list of migration functions

**Returns:**
- `getLatestData(data, version?)` - Мутирует data на месте, возвращает мутированный объект
- `applyUpdate(targetData, version?)` - Алиас для getLatestData (мутирует на месте)

---

## Behavior

### Mutation Semantics

**Key principle:** `getLatestData` and `applyUpdate` always mutate the input object in place.

```typescript
const migrations = defineMigrations(
  (v0) => ({ ...v0, version: 1 }),
);

const original = { version: 0 };
const result = migrations.getLatestData(original);

// original === { version: 1 } (mutated!)
// result === original (same reference)
```

Regardless of whether migration returns a new object or mutates in place, the input object is always mutated to the final migrated state.

### Version Parameter

- `version` = starting version index (0-based)
- Normalized: `Math.max(0, Math.floor(version))`
- Negative values → 0 (apply all migrations)
- Non-integer → truncated
- >= migration count → no migrations applied

---

### defineVersion

Creates a version definition with Zod schema and migration function.

```typescript
import { defineVersion } from '@shared/lib/migrations';
import { z } from 'zod';

const v1 = defineVersion(
  z.object({ name: z.string() }),
  (old: unknown) => ({ ...old, version: 1 })
);
```

**Parameters:**
- `schema` - Zod schema for the new version
- `up` - Migration function that transforms old state to new state

**Returns:** `{ schema: Z, up: (old: Old) => output<Z> }`

---

## Usage Examples

### Database Document Migration

```typescript
// src/shared/lib/databaseDocument/migrations/bodyMigrations.ts
import { defineMigrations } from '@shared/lib/migrations';
import { databaseStateV1 } from './versions/v1';
import { databaseStateV2 } from './versions/v2';
import { databaseStateV3 } from './versions/v3';

export const databaseBodyMigrations = defineMigrations(
  (bodyV0: object) => databaseStateV1.up(bodyV0),
  (bodyV1) => databaseStateV2.up(bodyV1),
  (bodyV2) => databaseStateV3.up(bodyV2),
);
```

### CFR Document Migration

```typescript
// src/shared/lib/cfrDocument/migrations.ts
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { defineMigrations } from '@shared/lib/migrations/defineMigrations';

export const applyCFRDocumentMigration = (data: object) => {
  return defineMigrations(
    (doc: object) => deepPatchJsonObject(doc, {
      name: 'new document',
      type: 'unknown',
      version: 1,
    }),
  ).applyUpdate(data, readVersion(data));
};
```

---

## Internal Dependencies

- `deepPutJsonObject` from `@shared/lib/changeObject` - Used in `applyUpdate` for deep object merging

---

## Implementation Details

### How It Works

1. `getLatestData` applies migrations via reduce - result may be new object or mutated
2. `deepPutJsonObject(targetData, migratedData)` copies all properties from migrated result back to original targetData
3. Original object is always mutated to final state
4. Returns the same reference as input

### Type System

- `MigrateConstraint<T, Ops>` - validates migration function chain
- `UpdateResult<T, Ops>` - computes final type after all migrations
- Generic type constraints ensure type safety through migration chain

---

## Architecture Notes

- Type constraint system ensures migration chain type safety
- `MigrateConstraint<T, Ops>` - validates migration function chain
- `UpdateResult<T, Ops>` - computes final type after all migrations
- Migration functions MUST return new objects (not mutate input)
