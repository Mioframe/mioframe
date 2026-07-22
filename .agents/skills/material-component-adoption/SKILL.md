---
name: material-component-adoption
description: 'Internal Material implementation stage used only inside a fresh isolated writable owner context for export, consumer migration, compatibility forwarding, and obsolete-owner cleanup.'
---

# Material component adoption

Run only inside the same fresh isolated writable owner context that implemented the current deepest-owner correction. It must not run in the root orchestrator or reviewer context.

Use it when the approved owner correction creates or changes a Material root export, migrates consumers, forwards or removes a legacy owner, or cleans compatibility paths.

## Entry gate

Before any adoption edit, confirm:

- execution context is `fresh-isolated-writable`;
- this is the same owner correction and locked contract as the implementation result;
- the owner is still the deepest unfinished stack entry;
- recursive child dependencies and prerequisites are independently ready;
- canonical token ownership is valid;
- every direct consumer of the changed public contract or extension is enumerated;
- the intended public export and exact legacy-owner disposition are locked.

A relocated directory, forwarding barrel, migrated import, or green path guard is not readiness evidence.

## Responsibility

For the approved owner correction:

1. create or update a public export only when child closure is complete;
2. migrate only consumers covered by the locked contract;
3. preserve accepted product behavior except named intentional deltas;
4. run migration-specific compatibility proof;
5. remove replaced implementation, declarations, exports, proof, aliases, and obsolete paths;
6. retain a legacy entry point only as forwarding/import-only compatibility when required.

If a consumer reveals an incompatible contract or another canonical owner, stop and return the exact finding to the root. Do not add a consumer-specific Material adapter or continue into another owner.

## Exit boundary

This stage may report adoption edits as implemented, but it cannot declare the owner ready. Readiness still requires a different fresh isolated read-only correction-final review.

## Result

```text
MATERIAL ADOPTION IMPLEMENTATION RESULT
Family:
Invocation scope:
Correction unit:
Execution context: fresh-isolated-writable
Status: implemented | blocked | checkpoint-required
Deepest owner confirmed: yes | no
Actual recursive dependency closure:
Canonical token ownership:
Public export result:
Migrated consumers:
Direct consumer compatibility:
Consumer proof:
Removed obsolete ownership:
Retained forwarding-only paths:
Readiness claim: forbidden
Review required: yes
Remaining owner gaps:
Blocker: none | <exact blocker>
Checkpoint reason: none | context-exhausted | runtime-exhausted | user-interrupted | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- execution in the root orchestrator or reviewer context;
- self-review or readiness claims;
- adoption while a deeper owner remains unfinished;
- root export, migration, forwarding, or removal with open child closure;
- consumer migration onto temporary, defective, private, cyclic, parallel, or relocation-only dependencies;
- consumer-specific Material APIs or adapters;
- selecting another correction, updating roadmap state, invoking review, or Git/PR operations.
