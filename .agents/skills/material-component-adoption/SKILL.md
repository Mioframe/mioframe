---
name: material-component-adoption
description: 'Internal Material procedure used only inside material-component for root export, consumer migration, compatibility forwarding, and obsolete-owner removal after recursive dependency and owner readiness are independently established.'
---

# Material component adoption

Run inside the `material-component` orchestrator context. Adoption shares current preflight, correction contract, recursive dependency graph, consumer scope, implementation, and continuation state.

Use it when a correction creates/changes a Material root export, migrates consumers, forwards/removes a legacy owner, or cleans compatibility paths.

## Entry gate

Before any adoption edit, independently confirm from current code:

- candidate canonical owner and actual implementation;
- complete recursive dependency closure for the supported surface;
- completed and independently reviewed foundation and official-family prerequisites;
- canonical token declaration ownership;
- valid semantics/lifecycle and all direct-consumer compatibility for changed contracts or extensions;
- passing Material boundary, token, and documentation architecture guards;
- intended public export, exact consumer scope, and legacy-owner state.

A declared `Dependency closure: closed`, relocated directory, forwarding barrel, migrated import, or green path guard is not sufficient without current owner/readiness evidence.

When consumers are already migrated or the legacy owner already removed while closure/readiness is blocked, adoption status is invalid. The orchestrator must complete recursive canonicalization or safely roll back premature adoption before lower-priority work.

## Responsibility

For the approved correction:

1. create or update the public export only for a ready owner;
2. migrate only consumers whose required contracts are ready;
3. inspect all direct consumers of changed public contracts or extensions for semantic compatibility;
4. preserve accepted product scenarios except named intentional deltas;
5. run migration-specific integration and compatibility proof;
6. remove replaced implementation, declarations, exports, proof, contracts, aliases, and compatibility paths;
7. retain a legacy entry point only as forwarding/import-only compatibility when required.

A dependency remains in the calling orchestration even when foundation or another family owns its implementation.

Do not make a new import path point at an uncorrected relocated legacy implementation. A canonical directory or barrel is not evidence of readiness.

If a consumer exposes unsupported capability or an incompatible public/dependency contract, return it to the orchestrator as required work. Do not add a consumer-specific Material adapter.

## Exit gate

Pass only when:

- every in-scope and direct contract consumer uses the intended ready owner compatibly;
- complete recursive dependency closure remains closed;
- canonical token declarations and runtime ownership remain valid;
- Material boundary/token/documentation guards pass;
- required product scenarios are preserved;
- no obsolete active owner or declaration covered by the correction remains;
- retained compatibility is forwarding/import-only;
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
Actual recursive dependency closure:
Prerequisite owner readiness:
Canonical token ownership:
Boundary/token/documentation guards:
Public export result:
Migrated consumers:
Direct consumer compatibility:
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
- root export, migration, forwarding, or removal with open recursive closure or unready prerequisite owner;
- trusting stale README closure, relocation, barrels, or path guards without current implementation evidence;
- consumer migration onto temporary legacy, missing, defective, private, fallback-masked, cyclic, parallel, or relocation-only dependencies;
- treating a used dependency as outside orchestration;
- silent public-contract, dependency, decomposition, or implementation changes;
- consumer-specific Material APIs or adapters;
- permanent aliases or deferred cleanup inside the correction;
- selecting the next correction, updating roadmap state, invoking review/verification, or starting another family;
- Git, branch, commit, pull-request, or merge operations.
