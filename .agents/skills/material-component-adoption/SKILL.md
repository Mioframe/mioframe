---
name: material-component-adoption
description: 'Internal Material workflow stage for migrating remaining consumers and removing obsolete family ownership.'
---

# Material component adoption

This is an internal stage skill. Use it only after `material-component-implementation` has completed the supported canonical family and validated one representative consumer.

It owns remaining consumer migration, integration-risk proof, and complete removal of obsolete ownership. It does not redesign the family contract, implement missing family capability, update the roadmap, or start another stage.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the ready family README;
- canonical public exports;
- every remaining affected consumer;
- the complete legacy implementation, exports, stories, tests, snapshots, contracts, and compatibility paths.

## Workflow

1. Confirm the canonical family already covers every required consumer scenario.
2. Migrate every remaining in-repository consumer through the curated Material public API.
3. Preserve accepted product behavior except for named intentional deltas.
4. Add only integration proof for risks introduced by the migration.
5. Remove obsolete implementation, exports, tests, stories, snapshots, temporary contracts, aliases, and compatibility paths.
6. Search the repository for stale imports and references to the removed owner.

If a consumer requires unsupported family capability or exposes a wrong public contract, return an exact blocker to `material-component`. Do not extend the family or add a consumer-specific adapter in this stage.

## Exit gate

Pass only when:

- every affected consumer uses the canonical public owner;
- required product scenarios remain preserved;
- no obsolete active implementation, export, contract, test, story, snapshot, alias, or compatibility path remains;
- one family owner remains.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: adoption
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Migrated consumers:
Removed legacy ownership:
Blocker: none | <exact blocker>
```

## Forbidden

- silent public-contract changes;
- family implementation expansion;
- consumer-specific Material APIs or adapters;
- permanent aliases or deferred cleanup;
- two active family owners;
- roadmap updates;
- starting review, verification, another stage, or another family directly.
