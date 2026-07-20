---
name: material-component-adoption
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates migration of remaining consumers and complete removal of obsolete family ownership after the canonical supported family is proved.'
---

# Material component adoption

Internal stage only. Use it after implementation has completed the supported canonical family and validated the representative consumer.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- the adoption phase of `src/shared/ui/material/docs/component-development.md`;
- the ready family README and canonical public exports;
- every remaining affected consumer;
- the complete legacy implementation, exports, stories, tests, snapshots, contracts, aliases, and compatibility paths.

## Responsibility

Execute the adoption phase exactly: migrate remaining consumers, preserve accepted product scenarios, prove only migration-specific integration risks, and remove the obsolete owner completely.

If a consumer exposes unsupported family capability or a wrong public contract, decomposition, or implementation, return an exact blocker to `material-component`. Do not extend the family or add a consumer-specific adapter in this stage.

## Exit gate

Pass only when every affected consumer uses the canonical public owner, required product scenarios remain preserved, no obsolete active path or compatibility residue remains, and exactly one family owner exists.

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

- direct user invocation;
- silent public-contract, decomposition, or family-implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases, deferred cleanup, or parallel owners;
- roadmap updates or starting review, verification, another stage, or another family directly.