---
name: material-component-contract
description: 'Internal Material workflow stage for resolving one component family contract before production implementation.'
---

# Material component contract

Internal stage only. `material-component` must lock the family, objective, scenarios, and non-goals before invoking it.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- Stage 1 of `src/shared/ui/material/docs/component-development.md`;
- current implementation, exports, consumers, stories, tests, snapshots, and legacy contract when present;
- current official Material 3 Expressive sources for the required scenarios.

## Responsibility

Execute Stage 1 exactly. Resolve the complete family contract before production edits and write its single durable owner at `components/<family>/README.md`, or at the permitted temporary legacy location while the implementation remains outside the canonical boundary.

Return any missing cross-family foundation capability as an exact blocker. Do not create a family-local substitute or invoke another stage.

## Exit gate

Pass only when the canonical contract records the representative consumer and every required foundation dependency, with:

```text
Unresolved: none
Readiness: ready
```

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Required foundation work: none | <exact work>
Representative consumer:
Blocker: none | <exact blocker>
```

## Forbidden

- production component edits or consumer migration;
- roadmap updates or starting another stage;
- unresolved placeholders or speculative surface, APIs, foundations, or abstractions;
- another family contract, audit, checklist, registry, or progress record.
