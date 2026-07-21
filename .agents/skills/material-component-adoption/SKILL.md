---
name: material-component-adoption
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates in-scope consumer migration and obsolete-owner removal after the canonical owner and all dependencies required by those consumers are ready.'
---

# Material component adoption

Internal stage only. Adoption is conditional. Use it only when the current correction objective includes relocation, public-entry migration, parallel-owner removal, or compatibility cleanup and the canonical implementation plus every dependency required by moved consumers is ready.

A focused correction that does not change ownership or import paths does not require this stage.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- the adoption phase of `src/shared/ui/material/docs/component-development.md`;
- the current family README, dependency inventory/closure result, alignment map, correction objective, and canonical public exports;
- every completed foundation or canonical-family prerequisite;
- every in-scope affected consumer;
- the legacy implementation, exports, stories, tests, snapshots, contracts, aliases, and compatibility paths covered by the current objective.

## Responsibility

Migrate only consumers whose required component and dependency contracts are ready and not classified `misaligned`, `unresolved`, `temporary-legacy-material`, `missing`, or `defective`.

For the current objective:

1. confirm dependency closure for every consumer category being moved;
2. migrate in-scope consumers through the intended public owner;
3. preserve accepted product scenarios except for named intentional deltas;
4. prove only migration-specific integration risks;
5. remove obsolete implementation, exports, proof, contracts, aliases, and compatibility paths replaced by this objective.

Do not use adoption to make a new import path point at an uncorrected legacy component or foundation contract. Do not migrate all consumers merely because a canonical directory or barrel exists.

A legacy compatibility entry point may remain only when it forwards to the canonical owner for still-unmigrated consumers; it cannot retain a parallel implementation.

If a consumer exposes unsupported capability or a wrong public contract, dependency, decomposition, foundation, or implementation, return an exact blocker to `material-component`. Do not extend the family or add a consumer-specific adapter in this stage.

## Exit gate

Pass only when:

- every in-scope consumer uses the intended ready owner;
- every dependency required by those consumers resolves to one ready canonical/generic/extension owner;
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
Dependency closure:
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
- consumer migration onto a known misaligned, unresolved, temporary legacy, missing, or defective component/dependency contract;
- silent public-contract, dependency, decomposition, or family-implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases, deferred cleanup within the current objective, or parallel active owners;
- requiring full-family adoption when the bounded correction objective does not change ownership;
- roadmap updates or starting review, verification, another stage, or another family directly.
