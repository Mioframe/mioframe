---
name: material-family-review
description: 'Use for an independent read-only final review of one full Material family reconstructed from current code, guards, consumers, proof, and verification.'
---

# Material family review

Review the complete current state of one official Material family after its `full-family` orchestrator reports no known required gap or internal prerequisite. Do not use Git/PR context or implementation reasoning.

## Inputs and reconstruction

Receive the supported surface, scenarios/platforms, durable owner README contract, implementation/public entries, supplied dependency/prerequisite results, consumers, proof/operator status, and repository rules.

Independently inspect current code and reconstruct:

- canonical owner/public export and legacy-owner state;
- actual imports, injected dependencies, styles, and token references;
- foundation/official-family owners;
- boundary, token, and documentation guard results;
- representative consumers/adoption scope;
- supported/unsupported surface and proof obligations.

Supplied inventories are claims, not authority. A used dependency cannot be excluded because another owner implements it.

## Review scope

Verify one valid canonical owner/API; no premature export/adoption/removal; API/native/accessibility/state semantics; DOM/layout/adaptation; token/style/motion ownership; every actual dependency/prerequisite; no temporary legacy/private/fallback/cyclic/defective/parallel ownership; complete consumer adoption/cleanup; sufficient proof/operator evidence; and final verification.

The owner README must contain durable contract facts only. Workflow state, backlog, correction/review history, shell output, commit narratives, and future passes are blockers even when their claims happen to be accurate.

Existing tests, stories, snapshots, and declarations are evidence, not Material authority.

## Completion

Return `complete` only when invocation scope was `full-family`, all required concerns are compliant or validly unsupported, dependency closure/prerequisites and Material guards pass, one canonical owner remains, adoption/cleanup and required proof are complete, operator comparison is accepted when required, documentation is durable-only, and final `pnpm verify` passed.

Return `complete-with-explicitly-unsupported-surface` only for optional, explicit, unused capability. Return `blocked` for any required defect, premature canonicalization, open dependency/prerequisite, failed guard, invalid owner documentation, missing proof, operator rejection, or verification failure. Return `not-enough-evidence` when current state cannot be inspected.

`converging` is not a final verdict.

## Result

```text
MATERIAL FAMILY REVIEW
Family:
Invocation scope:
Verdict: complete | complete-with-explicitly-unsupported-surface | blocked | not-enough-evidence
Canonical ownership result:
Actual dependency closure:
Boundary/token/documentation guards:
Prerequisite result:
Public contract and semantics result:
Token/style/motion result:
Consumer/adoption result:
Proof result:
Operator visual result:
Documentation result:
Verification result:
Blockers: none | <findings>
Major issues: none | <findings>
Minor issues: none | <findings>
Required next action: none | <exact correction>
```

Run once and at most once after substantive final corrections. A second failure returns consolidated blockers. Do not create a durable review document.

## Forbidden

- repository edits, delegation, implementation, or Git/PR analysis;
- trusting supplied closure without current import inspection;
- approving only the latest correction;
- approving with internal prerequisites, invalid owner docs, temporary/defective dependencies, premature canonicalization, failed guards, or red verification;
- broad repeated research without contradiction;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
