---
name: material-library-status
description: 'Use for a concise read-only Material library status report reconstructed from roadmap, current code, accepted owner reviews, guards, proof, verification, and an optional validated physical checkpoint.'
---

# Material library status

Read only:

1. `src/shared/ui/material/docs/roadmap.md`;
2. the active owner README for durable contract facts only;
3. current canonical owners, exports, implementations/imports, direct consumers, broader adoption scope, legacy-owner state, accepted owner review results, guards, proof, operator evidence, and verification.

Report:

- active root label, root kind (`material-component` or `material-foundation`), and invocation scope;
- root-to-deepest unfinished continuation stack validated against current code;
- checkpoint reason and whether it is one allowed physical reason;
- current deepest owner and whether it has a fresh writable implementation result;
- whether a different fresh read-only correction reviewer accepted that owner;
- actual recursive dependency closure and required prerequisites;
- canonical token ownership and semantics/lifecycle readiness;
- direct-consumer compatibility, adoption/cleanup, browser/operator proof, guards, and verification;
- alignment: `aligned`, `converging`, or `blocked`;
- exact external blocker and one same-root next action.

Only the deepest unfinished owner may be active. A parent owner cannot be reported ready while a deeper stack entry remains.

Implementation does not establish readiness. Missing, same-context, or `not-run` correction review keeps the owner unfinished.

A continuation checkpoint is valid only with one of:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, or repairable verification failure is not a checkpoint reason.

The next action for a converging operation must resume the same root command recorded by the roadmap. Never tell the operator to invoke a nested family or foundation owner separately.

Do not modify files, execute stages, inspect Git/PR state, or persist a parallel status record.
