---
name: material-component-review
description: 'Use for an independent read-only contract-gate or correction-final review of one bounded Material correction unit. Reviews selected concern evidence, dependency closure, prerequisites, affected owners, and proof only; complete family readiness belongs to material-family-review.'
---

# Material correction review

Review exactly one correction unit in one scope:

- `contract-gate` before production edits;
- `correction-final` after prerequisite completion, implementation, focused proof, and conditional adoption for that unit.

Use `material-family-review` only after the orchestrator reports no known required family gap.

## Independence and inputs

Run in a fresh read-only context that did not author the contract or implementation. When isolated contexts are unavailable, use a separately invoked read-only review pass with no edit tools and no prior implementation reasoning.

Receive only:

- family, review scope, correction objective, and concern plan;
- required scenarios and platforms;
- selected target slices and specialist results;
- complete dependency inventory and closure decision for the unit;
- correction contract and exact prerequisites;
- bounded current affected paths and owners;
- applicable proof and operator evidence.

Do not receive narrative review history, preferred conclusions, Git state, or pull-request context.

Independently verify changed, disputed, high-risk, or generalized claims. Do not re-derive unaffected locked target claims or audit unselected concern lanes without contradictory evidence.

## Contract gate

Verify:

- selected target and specialist work is sufficient for the correction;
- no required concern lane was omitted;
- every required dependency has an explicit owner, classification, readiness, proof, and replacement obligation;
- temporary legacy Material, missing, defective, cyclic, private, hidden-fallback, or parallel required dependencies become exact blockers or prerequisites;
- another official component family is not misclassified as foundation;
- correction priority, owner, completion condition, proof lane, and non-goals are explicit;
- token or Web evidence is sufficient for the bounded graph or behavior slice when selected;
- the unit is the highest-priority complete correction for the affected supported surface;
- production changes did not precede approval;
- workflow state records current truth without histories or ledgers.

Return `contract-gate-passed`, `contract-gate-failed`, `blocked-insufficient-evidence`, or `blocked-independent-review-unavailable`.

## Correction final

Review only:

- the implemented correction unit and changed owners;
- prerequisite completion and resulting dependency owners;
- absence of required temporary legacy imports or routes for the corrected surface;
- direct dependencies and affected consumers;
- required unit, browser, consumer, visual, architecture, and operator proof;
- selected token, DOM, style, motion, semantics, or lifecycle routes;
- cleanup and workflow-state accuracy.

A new canonical owner, owner migration, adoption, or alignment result cannot pass with open required dependency closure. A legacy compatibility path may forward to the canonical owner but cannot remain a parallel implementation.

Determine whether the correction unit is complete. Findings outside the unit return to the orchestrator as remaining family concerns; do not silently fix them or classify them as irrelevant.

When required browser execution is unavailable, return `blocked-insufficient-browser-evidence` unless current evidence establishes the observable result.

## Review budget

Run once initially and at most once after substantive corrections. A second failed review returns consolidated blockers and stops that correction path.

Mechanical fixes that do not change target, ownership, correction scope, proof decision, dependency closure, or observable behavior receive an orchestrator consistency check instead of another full review.

Do not restart full source research for wording, counts, cross-references, or documentation staleness.

## Findings

Consolidate findings into blockers, major issues, and minor issues. Maximum 12 actionable findings. Each finding states requirement, evidence, mismatch, affected scenario, required final state, and owning concern.

## Result

```text
MATERIAL CORRECTION REVIEW
Family:
Review scope: contract-gate | correction-final
Correction unit:
Status: complete | blocked
Gate result:
Correction objective: complete | incomplete | operator-acceptance-required
Selected lane results:
Dependency closure:
Prerequisite result:
Proof result:
Remaining family concerns returned to orchestrator: none | <exact concerns>
Blocker: none | <exact blocker>
```

## Forbidden

- repository modifications, delegation, correction invocation, or workflow advancement;
- Git, branch, commit, pull-request, or merge analysis;
- complete family verdict;
- broad audit outside selected lanes and affected owners without contradictory evidence;
- repeated verification of accepted claims without new evidence;
- approval with open dependencies, incomplete prerequisites, required legacy Material ownership, or insufficient proof;
- durable audits, histories, graph or route ledgers, checklists, registries, or scorecards.
