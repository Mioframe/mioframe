---
name: material-component-contract
description: 'Internal Material stage used only by material-component to synthesize a completed material-canonical-target result and a separate material-current-state-audit result into one family contract, alignment map, dependency map, prioritized correction unit, and locked proof lane before independent review.'
---

# Material component contract

Internal stage only. Follow `src/shared/ui/material/docs/component-development.md`; do not redefine its workflow.

## Required inputs

Receive:

- locked task scope from `material-component`;
- completed `material-canonical-target` result;
- completed `material-current-state-audit` result;
- current repository ref and applicable instructions;
- owning family README or temporary legacy contract.

Block when target and current-state research were not isolated, either result is incomplete, or production/proof changes for the proposed unit preceded the contract gate.

## Responsibility

Synthesize, validate, and write the single family contract and workflow record.

Resolve:

- canonical supported and unsupported surface;
- source decisions and platform applicability;
- complete concern classifications;
- dependency classifications and ownership;
- proof classifications;
- implementation decomposition;
- durable style and motion contracts;
- highest-priority complete correction unit;
- proof lane, compatibility impact, visual impact, operator requirement, and completion condition;
- remaining known gaps and next gate.

Do not copy role claims without checking them against repository evidence and official sources.

## Classification rules

Use the classifications and correction priority defined by `component-development.md`.

`confirmed-compliant` requires resolved applicable authority, matching implementation, correct ownership, faithful proof in the correct lane, and no unresolved contradiction.

`project-extension` additionally requires a current Mioframe scenario, explicit owner, Material compatibility, valid dependencies, and separate proof. A known defect prevents completion.

Classify every shared dependency as canonical Material, temporary legacy Material, project extension, or generic non-Material foundation. Repeated use does not establish foundation ownership.

Classify existing proof as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

## Motion contract

Validate that the current-state audit covered every motion route in code. Use its detailed route inventory as transient evidence.

Write only durable motion facts to the family README:

- supported state edges and visible result;
- owner of each independently changing motion concern;
- official timing/easing or explicit platform decision;
- interruption, reversal, cancellation, cleanup, and reduced-motion semantics;
- primary proof owner;
- classification and unresolved gaps.

Do not copy exact selectors, declarations, keyframe references, or runtime route lists into the README.

A motion concern cannot be `confirmed-compliant` when the audit reports a dead token, unused keyframe, `transition: all`, wrong owner, cascade conflict, shorthand reset, unstable endpoints, missing lifecycle behavior, stale runtime resource, incorrect reduced motion, unjustified expensive property, broad persistent `will-change`, or declaration-only proof.

## Correction unit

Select the smallest complete highest-priority unit allowed by the canonical workflow.

Record:

```text
CORRECTION UNIT
Gap:
Affected scenarios:
Canonical expected behavior:
Current defect:
Implementation owner:
Dependencies and blast radius:
Primary proof lane:
Why that lane owns the behavior:
Prepared failing observation:
Affected motion contract: none | <exact concern>
Compatibility impact:
Visible impact:
Operator acceptance required: yes | no
Completion condition:
```

A lower-priority improvement cannot bypass a higher-priority blocker affecting the same supported surface.

## README state

Update one coherent `MATERIAL WORKFLOW STATE` block and the applicable target, source-decision, assessment, alignment, dependency, decomposition, style/motion contract, proof, correction-unit, and remaining-gap sections.

Set:

```text
Current stage: contract-review
Canonical target status: locked | reopened
Assessment status: complete | blocked
Contract review status: not-started | failed
Implementation status: not-started
Final review status: not-started
Next gate: independent contract review
```

The roadmap and README must not contradict each other.

## Exit gate

Pass only when:

- target provenance and source decisions are credible;
- every mandatory concern is classified;
- dependencies and proof are classified;
- the transient motion audit is complete and durable motion contracts are accurate;
- decomposition has explicit owners;
- the highest-priority complete correction unit is selected;
- proof and compatibility decisions are locked;
- workflow state is coherent;
- the package is ready for independent contract review.

Passing this stage does not authorize production edits.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Current objective result: ready for contract review | blocked
Family alignment status: aligned | converging | blocked
Canonical target result:
Assessment result:
Source decisions:
Alignment classifications:
Dependency classifications:
Proof classifications:
Motion audit evidence: complete | incomplete
Durable motion contract:
Current correction unit:
Proof lane:
Remaining known gaps:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production, proof, story, snapshot, or consumer edits;
- target and current-state research in one unisolated pass;
- deriving target from existing behavior;
- hidden source conflicts or omitted concerns;
- exact implementation-route ledgers in the README;
- blanket preservation or rewrite decisions;
- lower-priority correction around a higher-priority blocker;
- wrong proof lane;
- roadmap advancement or another stage invocation;
- duplicate contracts, durable audits, registries, checklists, scorecards, or progress ledgers.
