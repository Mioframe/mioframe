---
name: material-component-review
description: 'Use for an independent read-only contract-gate or correction-final review of one bounded Material correction unit. Reviews selected concern evidence, dependency closure, prerequisites, and affected owners only; complete PR merge readiness belongs to material-pr-review.'
---

# Material correction review

Review exactly one correction unit in one scope:

- `contract-gate` before production edits;
- `correction-final` after prerequisite completion, implementation, and conditional adoption for that unit.

Use `material-pr-review` for complete PR merge readiness.

## Independence and inputs

Run in a fresh read-only context that did not author the contract or implementation.

Receive only:

- family, review scope, correction objective, and concern plan;
- required scenarios/platforms;
- selected target slices and specialist audit results;
- complete required-dependency inventory and closure decision;
- correction contract and exact prerequisites;
- current repository ref and bounded affected paths;
- applicable operator evidence.

Do not receive narrative review history or preferred conclusions.

Independently verify changed, disputed, high-risk, or generalized claims. Do not re-derive unaffected locked target claims or audit unselected concern lanes without contradictory evidence.

## Contract gate

Verify:

- required target slices and selected specialist audits are isolated and complete;
- no required lane was omitted from the concern plan;
- every dependency required by the correction/public surface has an explicit owner, classification, readiness, proof, and replacement obligation;
- temporary legacy Material, missing, defective, or parallel required dependencies become exact blocking prerequisites;
- another official component family is not misclassified as foundation;
- classifications, owner, correction priority, and proof lane follow the canonical workflow;
- token or Web route evidence is complete for the bounded graph/behavior slice when selected;
- the correction unit is the highest-priority complete unit for the affected PR-owned surface;
- production/proof changes did not precede approval;
- workflow state records current truth without history or ledgers.

Return `contract gate passed`, `contract gate failed`, `blocked — insufficient evidence`, or `blocked — independent review handoff required`.

## Correction final

Review only:

- the implemented correction unit and changed owners;
- prerequisite completion and resulting dependency owners;
- absence of required temporary legacy imports/routes for the corrected canonical surface;
- direct dependencies and affected consumers;
- required static/browser/visual/operator proof;
- token, DOM, style, motion, or semantics routes selected by the concern plan;
- cleanup and workflow-state accuracy.

A new canonical owner, owner migration, adoption, or alignment result cannot pass with open required dependency closure. A legacy compatibility path may forward to the canonical owner but cannot remain a parallel implementation.

Determine whether the correction unit is complete. Do not declare the complete PR mergeable and do not relabel PR-owned defects outside the current unit as external; list them for `material-pr-review`.

When required browser execution is unavailable, inspect existing evidence and return `blocked — insufficient browser evidence` if it cannot establish the observable result.

## Review budget

This role may run once initially and once after substantive corrections. If the second review fails, return consolidated blockers and stop.

Mechanical fixes that do not change target, ownership, correction scope, proof decision, dependency closure, or observable behavior do not require another full review. They receive a local orchestrator consistency check.

Do not restart full source research for wording, counts, cross-references, or documentation staleness.

## Findings

Consolidate findings into blockers, major issues, minor issues, and PR-level follow-up. Maximum 12 actionable findings total. Each finding states requirement, evidence, mismatch, affected scenario, required final state, and correction owner.

## Result

```text
MATERIAL CORRECTION REVIEW
Family:
Review scope: contract-gate | correction-final
Correction unit:
Status: complete | blocked
Gate result:
Correction objective: complete | incomplete | operator acceptance required
Selected lane results:
Dependency closure:
Prerequisite result:
Proof result:
PR-level follow-up:
Blocker: none | <exact blocker>
```

## Restrictions

- no repository modifications, delegation, correction invocation, or workflow advancement;
- no complete PR merge verdict;
- no broad audit outside selected lanes and affected owners without contradictory evidence;
- no repeated verification of accepted claims without new evidence;
- no approval with unknown/open required dependencies, incomplete prerequisites, or required legacy Material ownership;
- no durable audit, review history, graph ledger, route ledger, checklist, or scorecard;
- no approval with incomplete selected-lane evidence, ownership, proof, or required operator result.
