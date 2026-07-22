---
name: material-family-review
description: 'Mandatory fresh read-only final review of one complete Material family after the continuation stack is empty and every owner correction has independent acceptance.'
---

# Material family review

Review the complete current state of one official Material family only after the root orchestrator reports no known required gap or internal prerequisite.

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

Receive the supported surface, scenarios/platforms, durable owner README, implementation/public entries, accepted owner review results, consumers, proof/operator status, and repository rules.

Independently reconstruct from current code:

- canonical owner/public export and legacy-owner state;
- implementations, imports, styles, and token declarations/references;
- recursive foundation and official-family readiness;
- every direct consumer of changed contracts or extensions;
- boundary, token, documentation, browser, visual, and verification proof;
- continuation stack and roadmap validity.

Supplied inventories and accepted results are claims, not authority.

## Completion

Return `complete` only when:

- invocation scope is `full-family`;
- continuation stack is `none`;
- every owner correction has a fresh read-only `correction-final: complete` result;
- recursive dependency closure is complete;
- canonical ownership, API, semantics, lifecycle, accessibility, tokens, styles, motion, and platform adaptation are valid;
- all direct consumers are compatible;
- adoption, cleanup, legacy disposition, and required proof are complete;
- operator comparison is accepted when required;
- documentation is durable and accurate;
- final `pnpm verify` passed.

Return `blocked` for any required defect, incomplete owner review, non-empty stack, legacy-owned canonical token, incompatible consumer, missing proof, invalid documentation, or failed verification. Return `not-enough-evidence` when current state cannot be inspected. Return `not-run` when isolation is unavailable.

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
Token/style/motion result:
Direct consumer compatibility:
Consumer/adoption result:
Proof result:
Operator visual result:
Documentation result:
Verification result:
Blockers: none | <findings>
Major issues: none | <findings>
Minor issues: none | <findings>
Required next action: none | <exact correction returned to root orchestrator>
Checkpoint reason: none | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- repository edits, delegation, implementation, or Git/PR analysis;
- review by the root or any implementation/correction-review context;
- trusting supplied closure or accepted-review claims without inspection;
- approving a family with a non-empty stack or missing owner review;
- approving relocation-only prerequisites, incompatible consumers, stale docs, failed guards, or red verification;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
