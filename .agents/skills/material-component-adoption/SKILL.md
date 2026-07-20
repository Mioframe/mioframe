---
name: material-component-adoption
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates in-scope consumer migration and obsolete-owner removal after the canonical owner is ready for those consumers.'
---

# Material component adoption

Internal stage only. Adoption is conditional. Use it only when the current correction objective includes relocation, public-entry migration, parallel-owner removal, or compatibility cleanup and the canonical implementation is ready for every consumer being moved.

A focused correction that does not change ownership or import paths does not require this stage.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- the adoption phase of `src/shared/ui/material/docs/component-development.md`;
- the current family README, alignment map, correction objective, and canonical public exports;
- every in-scope affected consumer;
- the legacy implementation, exports, stories, tests, snapshots, contracts, aliases, and compatibility paths covered by the current objective.

## Responsibility

Migrate only consumers whose required contract is ready and not classified `misaligned` or `unresolved`.

For the current objective:

1. migrate in-scope consumers through the intended public owner;
2. preserve accepted product scenarios except for named intentional deltas;
3. prove only migration-specific integration risks;
4. remove obsolete implementation, exports, proof, contracts, aliases, and compatibility paths replaced by this objective.

Do not use adoption to make a new import path point at an uncorrected legacy contract. Do not migrate all consumers merely because a canonical directory or barrel exists.

If a consumer exposes unsupported capability or a wrong public contract, decomposition, foundation, or implementation, return an exact blocker to `material-component`. Do not extend the family or add a consumer-specific adapter in this stage.

## Exit gate

Pass only when:

- every in-scope consumer uses the intended ready owner;
- required product scenarios remain preserved;
- no obsolete path covered by the current objective remains;
- no parallel active owner was introduced;
- remaining consumers and ownership gaps are recorded honestly outside the objective.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: adoption
Status: complete | blocked
Exit gate: passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Evidence:
Changed ownership:
Migrated consumers:
Removed obsolete ownership:
Remaining consumers or compatibility gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- consumer migration onto a known misaligned or unresolved contract;
- silent public-contract, decomposition, or family-implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases, deferred cleanup within the current objective, or parallel active owners;
- requiring full-family adoption when the bounded correction objective does not change ownership;
- roadmap updates or starting review, verification, another stage, or another family directly.
