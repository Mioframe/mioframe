# Project Memory Workflow

Use this workflow whenever the task touches shared infrastructure, helper semantics, CRDT or VFS flows, schema or migration behavior, or `.project-memory/` itself.

## Procedure

1. Determine the touched scope before editing.
2. Run memory discovery with exact scope, parent subsystem, and task keywords.
3. Read the best matches before making behavior changes.
4. Decide whether the existing entry should be refreshed, merged, promoted, archived, or left alone.
5. Validate the memory system before finishing.

## Commands

Use the lookup helper first:

```sh
pnpm memory:lookup --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:lookup --scope src/shared/lib/changeObject --term deepPatchJsonObject
```

Validate before finishing:

```sh
pnpm memory:validate
```

## Decision Rules

- If an existing record already covers the rule and scope, merge evidence into it instead of creating a duplicate.
- Create a new `draft` only when the evidence is concrete enough to help the next agent.
- Move a record to `verified` only after focused tests, multiple independent evidence items, or code plus authoritative source support the rule.
- Move a record to `promoted` only in the same change that lands the stronger artifact.
- Move a record to `archived` when it is obsolete, contradicted, merged into another entry, or superseded by a better record. Add `archive-reason` and reciprocal `supersedes` or `superseded-by` links when replacement is involved.

## Promotion Bias

Prefer stronger artifacts over prose when the rule can live in:

- `AGENTS.md`
- focused tests
- guards or adapters
- migrations or schemas
- runtime boundary checks

Keep promoted entries as breadcrumbs only. Delete them later when the stronger artifact is directly discoverable without memory.
