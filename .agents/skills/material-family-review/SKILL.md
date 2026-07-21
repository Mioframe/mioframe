---
name: material-family-review
description: 'Use for an independent read-only final review of one full Material family. Reconstructs canonical ownership and actual dependencies from current code and returns complete only with closed prerequisites, clean boundary guards, complete adoption, proof, and verification.'
---

# Material family review

Review the complete current state of one official Material component family. Run only after a `full-family` orchestrator reports no known required gap or internal prerequisite.

This portable skill does not use Git history, branch metadata, PR data, or implementation reasoning.

## Independence and inputs

Run in a fresh read-only context. Receive family/supported surface, scenarios/platforms, current README and locked target decisions, implementation/public entry points, supplied dependency/prerequisite results, consumers/adoption scope, proof/operator status, and applicable repository rules.

The supplied dependency inventory and workflow state are claims to verify, not authority.

## Required independent reconstruction

Inspect current code and independently reconstruct:

- candidate canonical owner and public export;
- actual imports, injected dependencies, style sources, and token references;
- foundation and official-family dependency owners;
- Material boundary and token architecture guard results;
- representative consumers and legacy-owner state;
- supported/unsupported surface and proof obligations.

A used dependency cannot be excluded because another owner implements it or because the README labels it outside the family.

## Review scope

Verify:

- one valid canonical owner and intended public API;
- no premature root export, consumer migration, or legacy removal with open closure;
- public API, native semantics, accessibility, invalid combinations, and state ownership;
- anatomy, DOM, layout, adaptive behavior, and text scaling;
- token ownership/graph and color, typography, shape, elevation, state layer, ripple, focus, and motion contracts;
- every actual required dependency and completed prerequisite;
- no required temporary legacy Material owner, private cross-family import, hidden fallback, cycle, defective contract, or parallel implementation;
- complete requested consumer adoption and obsolete-owner cleanup;
- sufficient unit, browser, consumer, visual, boundary, architecture, operator, and final verification evidence;
- compact accurate README without stale objective, review history, or future-pass narrative.

Existing tests, stories, snapshots, and declarations are evidence, not Material authority or architecture approval.

## Completion rules

Return `complete` only when:

- invocation scope was `full-family`;
- all required concerns are compliant or validly unsupported;
- actual dependency closure is complete;
- all required prerequisites are ready;
- boundary and token guards pass;
- one canonical owner/public contract remain;
- adoption and cleanup are complete;
- semantic, token, DOM, style, and motion proof is sufficient;
- operator comparison is accepted when required;
- final `pnpm verify` passed.

Return `complete-with-explicitly-unsupported-surface` only when the unsupported capability is optional, explicit, and unused by current required scenarios/consumers.

Return `blocked` for any required defect, stale state, premature canonicalization, open dependency, internal prerequisite, missing proof, operator rejection, boundary failure, or verification failure.

Return `not-enough-evidence` when required current-state inputs cannot be inspected.

`converging` is not a final family-review verdict.

## Review budget and findings

Run once and at most once after substantive final corrections. A second failure returns consolidated blockers.

Consolidate blockers, major issues, and minor issues, maximum 12 actionable findings. Each states requirement, evidence, mismatch, affected scenario, required final state, and owning concern. Do not create a durable audit/history document.

## Result

```text
MATERIAL FAMILY REVIEW
Family:
Invocation scope:
Verdict: complete | complete-with-explicitly-unsupported-surface | blocked | not-enough-evidence
Canonical ownership result:
Actual dependency closure:
Supplied inventory discrepancy: none | <details>
Boundary guard:
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

## Forbidden

- repository edits, delegation, or implementation;
- Git/PR/merge analysis;
- trusting supplied dependency closure without current import inspection;
- approving only the latest correction;
- approving with internal prerequisites, temporary/defective dependencies, premature canonicalization, failed guards, or red verification;
- broad repeated research without contradiction;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
