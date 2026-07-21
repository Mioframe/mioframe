---
name: material-family-review
description: 'Use for an independent read-only final review of one complete Material component family after the orchestrator reports no known required gaps. Reviews the current resulting family state, ownership, dependencies, supported surface, consumers, proof, documentation, and verification obligations without using Git or pull-request context.'
---

# Material family review

Review the complete current state of one official Material component family. Run only after `material-component` reports that all known required corrections and prerequisites are complete.

This is a portable repository skill. It does not depend on a specific agent runtime, Git history, branch metadata, or pull-request data.

## Independence

Run in a fresh read-only context that did not author the implementation or correction contracts. When isolated contexts are unavailable, use a separately invoked read-only review pass with no edit tools and no access to prior implementation reasoning.

Receive only:

- family and requested supported surface;
- required scenarios and platforms;
- owning family README and locked official decisions;
- current implementation and public entry points;
- complete dependency inventory and prerequisite results;
- representative consumers and adoption scope;
- applicable proof and operator comparison status;
- applicable repository instructions and verification obligations.

Do not receive preferred conclusions, narrative review history, or implementation reasoning.

## Review scope

Independently verify:

- family boundary and one canonical owner;
- supported and explicitly unsupported surface;
- public API, native semantics, accessibility, invalid combinations, and state ownership;
- anatomy, DOM ownership, layout, adaptive behavior, and text scaling;
- component, system, reference, extension, and private token ownership and graph direction;
- color, typography, shape, elevation, state layer, ripple, focus, and motion contracts when applicable;
- every required direct dependency and completed prerequisite;
- absence of required temporary legacy Material ownership, private cross-family imports, hidden required fallbacks, cycles, and parallel implementations;
- affected consumers, public exports, compatibility paths, and obsolete-owner cleanup;
- unit, browser, consumer, visual, architecture, and operator evidence required by the supported surface;
- family README accuracy and final verification obligations.

Existing code, tests, stories, snapshots, and green checks are evidence, not Material authority.

Recheck changed, high-risk, generalized, or contradictory claims. Do not automatically repeat complete source research for accepted claims without contradictory evidence.

## Completion rules

Return `complete` only when:

- all required concerns are compliant or explicitly unsupported by a valid decision;
- dependency closure is complete;
- all required foundation and official-family prerequisites are ready;
- one canonical owner and intended public contract remain;
- requested consumer adoption and obsolete-owner cleanup are complete;
- all applicable proof is sufficient;
- operator comparison is accepted when required;
- the current family README records truth without workflow history;
- final repository verification can validly establish completion.

Return `complete-with-explicitly-unsupported-surface` only when unsupported capability is optional, clearly documented, and not required by current consumers or the requested family scope.

Return `blocked` for any required defect, unresolved official evidence, open dependency, missing proof, unavailable operator result, or verification failure.

Return `not-enough-evidence` when required current-state inputs are missing.

## Review budget

Run once initially and at most once after substantive final corrections. A second failed review returns consolidated blockers and stops. Mechanical documentation corrections that do not change a contract or observable result do not require another full review.

## Findings

Consolidate findings into blockers, major issues, and minor issues. Maximum 12 actionable findings. Each finding states:

- requirement;
- current evidence;
- mismatch;
- affected scenario;
- required final state;
- owning correction concern.

Do not create a durable audit or review-history document.

## Result

```text
MATERIAL FAMILY REVIEW
Family:
Verdict: complete | complete-with-explicitly-unsupported-surface | blocked | not-enough-evidence
Supported surface result:
Canonical ownership result:
Dependency closure:
Prerequisite result:
Public contract and semantics result:
Token/style/motion result:
Consumer/adoption result:
Proof result:
Operator visual result:
Documentation result:
Verification result:
Blockers: none | <consolidated findings>
Major issues: none | <consolidated findings>
Minor issues: none | <consolidated findings>
Required next action: none | <exact correction>
```

## Forbidden

- repository edits, delegation, or implementation;
- Git, branch, commit, pull-request, or merge analysis;
- approving only the latest correction instead of the complete family state;
- broad re-research of accepted claims without contradiction;
- approval with unknown or temporary required dependencies;
- approval based only on green tests, snapshots, or declarations;
- durable audits, histories, ledgers, checklists, registries, or scorecards.
