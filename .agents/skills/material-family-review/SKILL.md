---
name: material-family-review
description: 'Mandatory fresh read-only final review of one complete Material family after the continuation stack is empty and every owner correction has independent acceptance.'
---

# Material family review

Review the complete current state of one official Material family after the root orchestrator reports no known required gap or internal prerequisite. This review is mandatory before both terminal outcomes: `aligned` and external `blocked`, including runs where no new implementation was needed.

## Independence

Run in a fresh isolated read-only context that did not orchestrate, design, implement, or correction-review this family operation.

Required declaration:

```text
Review context: fresh-isolated-read-only
Prior family context reused: no
Repository writes available: no
```

If a fresh read-only context is unavailable, return `not-run` with checkpoint reason `isolated-review-context-unavailable`. Do not perform final review in the root or any owner context.

## Reconstruction

Receive the supported surface, scenarios/platforms, durable owner README, implementation/public entries, accepted owner review results, consumers, proof/operator status, current-head verification evidence, root base commit, and repository rules.

Independently reconstruct from current code:

- canonical owner/public export and legacy-owner state;
- implementations, imports, styles, and token declarations/references;
- recursive foundation and official-family readiness;
- every direct consumer of changed contracts or extensions;
- every consumer of an owner created, moved, forwarded, or behaviorally changed by the active operation, including consumers in other official Material families;
- every `Known gaps`, `unresolved`, approximation, temporary compatibility, and future-correction statement in owner documentation and current code;
- every distinct public sentinel/value state such as `undefined`, `false`, `0`, boundaries, and invalid/out-of-range values when semantics differ;
- boundary, token, documentation, browser, visual, and verification proof;
- continuation stack and roadmap validity.

Supplied inventories, scope claims, accepted results, prior logs, and README statements are claims, not authority.

## Verification attribution

When final verification is red:

1. run or inspect a fresh exact failure on the current head;
2. reproduce the same command/lane on the root base commit;
3. determine whether the failing code directly or transitively consumes any owner changed by the active operation.

If the failure does not reproduce on base, or the failing code consumes a changed owner, it is internal. Return the nearest changed canonical owner as the required correction so the root restores it to the continuation stack. A consumer's separate official family label does not remove it from changed-owner compatibility scope.

Only a same-command failure reproduced on base and shown independent of every active-operation change may be reported as an external verification blocker. Do not infer this from Git history, import-only patches, or an earlier verification log.

## Completion

Return `complete` only when:

- invocation scope is `full-family`;
- continuation stack is `none`;
- every owner correction has a fresh read-only `correction-final: complete` result;
- recursive dependency closure is complete;
- every documented gap is either outside the explicitly supported surface or resolved; a required open gap is restored to the continuation stack;
- canonical ownership, API, semantics, lifecycle, accessibility, tokens, styles, motion, and platform adaptation are valid;
- sentinel/value-state semantics and invalid-value behavior are consistent across the public owner, focused proof, and all direct consumers;
- all direct consumers and all changed-owner consumers are compatible;
- adoption, cleanup, legacy disposition, and required proof are complete;
- operator comparison is accepted when required;
- documentation is durable and accurate;
- final `pnpm verify` passed.

Return `blocked` with an internal correction for any required defect, unresolved required gap, sentinel/value-state incompatibility, incomplete owner review, non-empty stack, legacy-owned canonical token, incompatible consumer, missing proof, invalid documentation, or failed verification attributable to the active operation. Return external `blocked` only for a verified base-reproduced condition independent of the operation. Return `not-enough-evidence` when current state cannot be inspected. Return `not-run` when isolation is unavailable.

## Result

```text
MATERIAL FAMILY REVIEW
Family:
Invocation scope:
Review context: fresh-isolated-read-only
Prior family context reused: no
Repository writes available: no
Verdict: complete | complete-with-explicitly-unsupported-surface | blocked | not-enough-evidence | not-run
Canonical ownership result:
Actual recursive dependency closure:
Accepted owner review chain:
Canonical token ownership:
Continuation stack:
Boundary/token/documentation guards:
Public contract and semantics result:
Unresolved gap reconciliation:
Sentinel/value-state compatibility:
Token/style/motion result:
Changed-owner consumer compatibility:
Direct consumer compatibility:
Consumer/adoption result:
Proof result:
Operator visual result:
Documentation result:
Verification result:
Verification attribution: internal-owner-restored | external-base-reproduced | not-applicable
Blockers: none | <findings>
Major issues: none | <findings>
Minor issues: none | <findings>
Required next action: none | <exact correction returned to root orchestrator> | <exact external unblock action>
Checkpoint reason: none | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- repository edits, delegation, implementation, or Git/PR analysis;
- review by the root or any implementation/correction-review context;
- skipping final review because no implementation occurred or verification is already known red;
- trusting supplied closure, scope, attribution, or accepted-review claims without inspection;
- approving a family with a non-empty stack, missing owner review, unresolved required gap, or unverified sentinel/value-state semantics;
- treating another repository Material family as external when it consumes an owner changed by the active operation;
- external-blocker attribution without same-command base reproduction;
- approving relocation-only prerequisites, incompatible consumers, stale docs, failed guards, or red verification;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
