---
name: material-component-contract
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates resolution of one family documentation contract, implementation decomposition, style ownership, proof map, and implementation order before production edits.'
---

# Material component contract

Internal stage only. `material-component` must lock the family, objective, scenarios, and non-goals before invoking it.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- the contract and implementation-blueprint phase of `src/shared/ui/material/docs/component-development.md`;
- current implementation, exports, consumers, stories, tests, snapshots, and legacy contract when present;
- current official Material 3 Expressive sources for the required scenarios.

## Responsibility

Execute the contract and implementation-blueprint phase exactly. Resolve the complete family contract before production edits and write its single durable owner at `components/<family>/README.md`, or at the permitted temporary legacy location while the implementation remains outside the canonical boundary.

The README must resolve implementation decomposition, style ownership, co-location decisions, proof ownership, applicable initial failing proof, browser scenarios, implementation order, representative consumer, and every required foundation dependency. Do not prescribe a universal file count, but do not permit a monolithic implementation when independent responsibilities or proof owners exist.

Return any missing cross-family foundation capability as exact required work. Do not create a family-local substitute or invoke another stage.

## Exit gate

Pass only when the canonical contract records all required fields with:

```text
Unresolved: none
Readiness: ready
```

Every responsibility has one implementation owner, every observable contract has one primary proof owner, style ownership is explicit, implementation order is resolved, and the representative consumer and foundation requirements are named.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Implementation decomposition:
Style ownership:
Proof map:
Implementation order:
Required foundation work: none | <exact work>
Representative consumer:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production component edits, executable proof implementation, or consumer migration;
- roadmap updates or starting another stage;
- unresolved placeholders or speculative surface, APIs, files, foundations, or abstractions;
- a universal file template or artifact count;
- another family contract, durable audit, separate checklist, registry, or progress record.