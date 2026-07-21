---
name: material-component-adoption
description: 'Internal Material procedure used only inside material-component for root export, consumer migration, compatibility forwarding, and obsolete-owner removal after actual complete dependency closure is independently established.'
---

# Material component adoption

Run inside the `material-component` orchestrator context. Adoption shares current preflight, correction contract, dependency graph, consumer scope, implementation, and continuation state.

Use it when a correction creates/changes a Material root export, migrates consumers, forwards/removes a legacy owner, or cleans compatibility paths.

## Entry gate

Before any adoption edit, independently confirm from current code:

- candidate canonical owner and real imports;
- complete dependency closure for the supported surface;
- completed foundation and official-family prerequisites;
- passing Material boundary and token architecture guards;
- intended public export;
- exact consumer scope;
- legacy-owner state.

A declared `Dependency closure: closed` is not sufficient without current import and guard evidence.

When consumers are already migrated or the legacy owner already removed while closure is blocked, adoption status is invalid. The orchestrator must close dependencies or safely roll back premature canonicalization before lower-priority work.

## Responsibility

For the approved correction:

1. create or update the public export only for a ready owner;
2. migrate only consumers whose required contracts are ready;
3. preserve accepted product scenarios except named intentional deltas;
4. run migration-specific integration and compatibility proof;
5. remove replaced implementation, exports, proof, contracts, aliases, and compatibility paths;
6. retain a legacy entry point only as forwarding-only compatibility when required.

A dependency remains in the calling orchestration even when foundation or another family owns its implementation.

Do not make a new import path point at an uncorrected legacy dependency. A canonical directory or barrel is not evidence of readiness.

If a consumer exposes unsupported capability or a wrong public/dependency contract, return it to the orchestrator as required work. Do not add a consumer-specific Material adapter.

## Exit gate

Pass only when:

- every in-scope consumer uses the intended ready owner;
- complete required dependency closure remains closed;
- Material boundary/token guards pass;
- required product scenarios are preserved;
- no obsolete path covered by the correction remains;
- retained compatibility is forwarding-only;
- no parallel active owner exists;
- for `full-family`, remaining consumers/ownership gaps require continued orchestration rather than termination.

## Result

```text
MATERIAL STAGE RESULT
Family:
Invocation scope:
Stage: adoption
Correction unit:
Status: complete | blocked
Actual dependency closure:
Boundary guard:
Public export result:
Migrated consumers:
Consumer proof:
Removed obsolete ownership:
Retained forwarding-only paths:
Continuation required: yes | no
Remaining consumers or gaps:
Blocker: none | <exact blocker>
```

Return control to the orchestrator for correction-final review, preflight refresh, and continuation.

## Forbidden

- direct user invocation or separate agent delegation;
- root export, migration, forwarding, or removal with open dependency closure;
- trusting stale README closure without current import evidence;
- consumer migration onto temporary legacy, missing, defective, private, fallback-masked, cyclic, or parallel dependencies;
- treating a used dependency as outside orchestration;
- silent public-contract, dependency, decomposition, or implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases or deferred cleanup inside the correction;
- selecting the next correction, updating roadmap state, invoking review/verification, or starting another family;
- Git, branch, commit, pull-request, or merge operations.
