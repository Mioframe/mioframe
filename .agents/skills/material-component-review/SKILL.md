---
name: material-component-review
description: 'Use for an independent read-only contract-gate or correction-final review of one bounded Material correction. Independently reconstructs actual imports and widens to complete dependency closure whenever canonical ownership, root exports, consumer migration, legacy removal, adoption, or alignment is involved.'
---

# Material correction review

Review one correction in one scope:

- `contract-gate` before production edits;
- `correction-final` after prerequisites, implementation, focused proof, and conditional adoption.

Use `material-family-review` only after the orchestrator reports no known required family gap.

## Independence and inputs

Run in a fresh read-only context that did not author the contract or implementation. When isolated contexts are unavailable, use a separate read-only pass with no edit tools and no prior implementation reasoning.

Receive:

- family, invocation scope, review scope, correction objective, and concern plan;
- required scenarios and platforms;
- selected target slices and specialist results;
- supplied dependency inventory and closure decision;
- correction contract and exact prerequisites;
- affected owners, exports, consumers, and proof.

The supplied dependency inventory is a claim to verify, not trusted input. Independently inspect the actual candidate owner imports, injected dependencies, style sources, token references, public exports, representative consumers, and legacy-owner state.

Do not receive narrative review history, preferred conclusions, Git state, or PR context.

## Automatic scope widening

Review scope automatically includes complete dependency closure for the supported surface when the correction or current state does any of the following:

- creates or preserves a candidate canonical owner;
- creates or changes the Material root export;
- migrates any consumer to the candidate owner;
- deletes or forwards the legacy owner;
- claims canonical, migrated, adoption-complete, converging-ready, or aligned status.

For these triggers, bounded correction wording cannot exclude a dependency actually used by the candidate owner. A finding is not `outside this unit` merely because another foundation or Material family owns the fix.

## Contract gate

Verify:

- invocation scope is correct: a family-only request is `full-family`, not focused work;
- persisted README/roadmap state was checked against current code and stale scope or conclusions were discarded;
- selected target and specialist work are sufficient;
- no required concern lane was omitted;
- the actual dependency inventory is complete;
- each dependency has owner, classification, readiness, proof, and replacement obligation;
- temporary legacy Material, missing, defective, cyclic, private, fallback-masked, or parallel required dependencies become exact prerequisites or external blockers;
- another official component family is not misclassified as foundation;
- a dependency owned elsewhere remains inside the calling family's orchestration;
- the correction is the highest-priority complete unit;
- no lower-priority local correction bypasses blocked dependency ownership for the same supported surface;
- production edits did not precede approval;
- workflow state records current truth without history or future-pass narratives.

Return `contract-gate-passed`, `contract-gate-failed`, `blocked-insufficient-evidence`, or `blocked-independent-review-unavailable`.

## Correction final

Independently verify:

- the implemented correction and changed owners;
- actual prerequisite completion and resulting dependency owners;
- absence of required temporary legacy imports or routes for the corrected/canonical surface;
- direct dependencies, exports, consumers, and legacy-owner state;
- required unit, browser, consumer, visual, boundary, architecture, and operator proof;
- selected token, DOM, style, motion, semantic, and lifecycle routes;
- cleanup and workflow-state accuracy.

A canonical owner, root export, consumer migration, legacy-owner removal, adoption, or alignment result cannot pass with open dependency closure.

If premature canonicalization already exists, return a blocker requiring dependency closure or safe rollback before lower-priority work.

For `full-family`, a passed correction does not authorize termination while required gaps or internal prerequisites remain. Return them to the orchestrator and require continuation.

When browser evidence is required but unavailable, return `blocked-insufficient-browser-evidence` unless existing evidence proves the observable result.

## Review budget

Run once initially and at most once after substantive corrections. A second failed review returns consolidated blockers and stops that correction path.

Mechanical fixes that do not change target, ownership, correction scope, proof, dependency closure, or observable behavior receive an orchestrator consistency check instead of another broad review.

## Findings

Consolidate into blockers, major issues, and minor issues. Maximum 12 actionable findings. Each finding states requirement, current evidence, mismatch, affected scenario, required final state, and owning correction concern.

## Result

```text
MATERIAL CORRECTION REVIEW
Family:
Invocation scope:
Review scope: contract-gate | correction-final
Correction unit:
Canonicalization trigger: yes | no
Status: complete | blocked
Gate result:
Actual dependency closure:
Supplied inventory discrepancy: none | <missing/misclassified dependencies>
Prerequisite result:
Proof result:
Continuation required: yes | no
Remaining family concerns: none | <exact concerns>
Blocker: none | <exact blocker>
```

## Forbidden

- repository modifications, delegation, correction invocation, or workflow advancement;
- trusting the supplied dependency inventory without inspecting actual imports;
- accepting a used dependency as outside scope because another owner implements it;
- accepting canonical export, migration, legacy removal, adoption, or alignment with open closure;
- complete family verdict;
- broad unrelated audit without contradictory evidence;
- Git, branch, commit, pull-request, or merge analysis;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
