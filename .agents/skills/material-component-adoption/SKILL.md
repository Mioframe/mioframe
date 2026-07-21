---
name: material-component-adoption
description: 'Internal Material procedure used only inside material-component for bounded consumer migration and obsolete-owner removal after the canonical owner and every dependency required by those consumers are ready.'
---

# Material component adoption

Run inside the `material-component` orchestrator context. This procedure is not an independent agent entry point because adoption shares the current correction contract, dependency graph, consumer scope, implementation decisions, and continuation state.

Adoption is conditional. Use it only when the current correction includes relocation, public-entry migration, parallel-owner removal, or compatibility cleanup and the canonical implementation plus every dependency required by moved consumers is ready.

A focused correction that does not change ownership or import paths does not require adoption.

## Inputs

Use:

- applicable `AGENTS.md` files and Material architecture rules;
- current family README and workflow state;
- current correction contract and dependency closure;
- completed foundation or official-family prerequisites;
- canonical public exports;
- exact in-scope consumers;
- legacy implementation, exports, stories, proof, aliases, and compatibility paths replaced by the current correction.

Do not repeat family orientation, concern audits, or dependency research already locked by the orchestrator.

## Responsibility

Migrate only consumers whose required component and dependency contracts are ready and not classified `misaligned`, `unresolved`, `temporary-legacy-material`, `missing`, `defective`, or `parallel-owner`.

For the current correction:

1. confirm dependency closure for every consumer category being moved;
2. migrate only in-scope consumers through the intended public owner;
3. preserve accepted product scenarios except for named intentional deltas;
4. run migration-specific integration and compatibility proof;
5. remove obsolete implementation, exports, proof, contracts, aliases, and compatibility paths replaced by the correction.

Do not make a new import path point at an uncorrected legacy component or foundation contract. Do not migrate all consumers merely because a canonical directory or barrel exists.

A legacy compatibility entry point may remain only when it forwards to the canonical owner for still-unmigrated consumers. It cannot retain a parallel implementation.

If a consumer exposes unsupported capability or a wrong public contract, dependency, decomposition, foundation, or implementation, return the exact blocker to the orchestrator. Do not extend the family or add a consumer-specific adapter inside adoption.

## Exit gate

Pass only when:

- every in-scope consumer uses the intended ready owner;
- every dependency required by those consumers resolves to one ready canonical, generic, or extension owner;
- required product scenarios remain preserved;
- no obsolete path covered by the correction remains;
- no parallel active owner was introduced;
- remaining consumers and ownership gaps are recorded honestly outside the correction.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: adoption
Correction unit:
Status: complete | blocked
Dependency closure:
Migrated consumers:
Consumer proof:
Removed obsolete ownership:
Retained forwarding-only paths:
Remaining consumers or compatibility gaps returned to orchestrator:
Blocker: none | <exact blocker>
```

Return control to the orchestrator for correction-final review and continuation.

## Forbidden

- direct user invocation or separate agent delegation;
- repeating orientation, target research, or concern audits;
- consumer migration onto a misaligned, unresolved, temporary legacy, missing, defective, or parallel dependency;
- silent public-contract, dependency, decomposition, or implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases, deferred cleanup inside the current correction, or parallel active owners;
- requiring complete-family adoption when the bounded correction does not change ownership;
- selecting the next correction, updating roadmap state, invoking review or verification, or starting another family;
- Git, branch, commit, pull-request, or merge operations.
