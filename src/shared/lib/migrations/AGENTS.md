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
  (v0) => ({ ...v0, version: 1 }),
  (v1) => ({ ...v1, version: 2 }),
  (v2) => ({ ...v2, version: 3 }),
);

// getLatestData - returns transformed data WITHOUT mutating original (pure)
const original = { name: 'test', version: 0 };
const result = migrations.getLatestData(original);
// original unchanged: { name: 'test', version: 0 }
// result: { name: 'test', version: 3 }
// result !== original (different objects)

// applyUpdate - mutates original target object in place
const target = { name: 'test', version: 0 };
const updated = migrations.applyUpdate(target, 0);
// target === updated (same reference, mutated)
// target: { name: 'test', version: 3 }
```

**Parameters:**
- Variadic list of migration functions

**Returns:**
- `getLatestData(data, version?)` - Returns transformed data WITHOUT mutating original (pure function)
- `applyUpdate(targetData, version?)` - Mutates targetData in place, returns mutated object

---

## Behavior

### Mutation Semantics

**Key principle:** `getLatestData` is a pure function (immutable), `applyUpdate` mutates the input.

```typescript
// getLatestData - pure, immutable
const migrations = defineMigrations(
  (v0) => ({ ...v0, version: 1 }),
);

const original = { version: 0 };
const result = migrations.getLatestData(original);

// original === { version: 0 } (unchanged!)
// result === { version: 1 } (new object)
// result !== original (different references)

// applyUpdate - mutates target in place
const target = { version: 0 };
const mutated = migrations.applyUpdate(target);

// target === { version: 1 } (mutated!)
// mutated === target (same reference)
```

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

1. `getLatestData` applies migrations via reduce - returns new object (pure)
2. `applyUpdate` calls `getLatestData`, then uses `deepPutJsonObject(targetData, migratedData)` to copy all properties back to original target
3. `applyUpdate` mutates original object to final state and returns same reference
4. `getLatestData` returns new object without modifying input

### Type System

- `MigrateConstraint<T, Ops>` - validates migration function chain
- `UpdateResult<T, Ops>` - computes final type after all migrations
- Generic type constraints ensure type safety through migration chain

---

## Architecture Notes

- Type constraint system ensures migration chain type safety
- `MigrateConstraint<T, Ops>` - validates migration function chain
- `UpdateResult<T, Ops>` - computes final type after all migrations
