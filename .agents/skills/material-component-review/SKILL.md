---
name: material-component-review
description: 'Use for an independent read-only contract or correction-final review. Reconstructs recursive dependency and prerequisite readiness whenever canonical ownership, exports, adoption, or legacy removal is involved.'
---

# Material correction review

Review one correction as `contract-gate` before production edits or `correction-final` after prerequisites, implementation, proof, and conditional adoption. Use `material-family-review` only after no known required family gap remains.

## Independence and inputs

Run in a fresh read-only context without prior implementation reasoning. Receive the family/invocation/review scope, objective, scenarios/platforms, selected evidence, supplied dependency inventory, correction contract, prerequisites, affected owners/exports/consumers, and proof.

The supplied inventory and prerequisite results are claims. Independently inspect actual candidate and prerequisite implementations, imports, injected dependencies, style sources, token declarations/references, public exports, every direct consumer of changed public contracts or extensions, legacy-owner state, and applicable guards.

Do not receive narrative review history, preferred conclusions, Git state, or PR context.

## Automatic scope widening

Review complete recursive dependency closure for the supported surface whenever current/proposed state creates or preserves a canonical owner, root export, consumer migration, legacy removal/forwarding, or readiness/adoption/alignment claim.

Bounded wording cannot exclude an actually used dependency. A finding is not outside the correction because foundation or another family owns the fix.

## Contract gate

Verify:

- correct invocation scope and code-first reconstruction;
- sufficient selected evidence and concern lanes;
- complete actual dependencies and executable nested prerequisites;
- each prerequisite's required canonical owner, own dependencies, tokens, semantics/lifecycle, public contract, direct consumers, compatibility route, proof, and independent review;
- another component is not misclassified as foundation;
- relocation/forwarding/barrel/import migration is not treated as readiness;
- the correction is highest priority and production edits did not precede approval.

The owner README must contain durable contract facts only. Workflow state, backlog, review history, shell output, commit narratives, and future passes are blockers, not inputs to validate.

Return a passed/failed contract gate or an exact insufficient-evidence/independence blocker.

## Correction final

Verify the implemented owner correction, recursive prerequisite readiness, resulting owners/imports, canonical token declarations, exports/consumers/legacy state, cleanup, Material guards, and required unit/browser/consumer/visual/operator proof.

For any changed public contract or project extension, inspect all direct consumers for semantic compatibility; representative sampling is insufficient when the consumer set is enumerable.

A moved legacy implementation is not ready until its own Material contract is corrected and independently reviewed. Known defects, legacy-owned tokens, missing lifecycle/accessibility proof, or incompatible consumers block it even when paths and guards are green.

Canonicalization cannot pass with open recursive dependency closure. Premature canonicalization requires closure or safe rollback before lower-priority work.

A passed correction does not authorize termination of `full-family` while gaps, defective prerequisites, or internal prerequisites remain. Return them to the orchestrator with continuation required.

Browser evidence must prove observable behavior; declarations or screenshots alone are insufficient when lifecycle behavior is required.

## Budget and result

Run once and at most once after substantive correction. A second failure returns consolidated blockers. Mechanical wording fixes receive a local consistency check.

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
Supplied inventory discrepancy:
Prerequisite owner readiness:
Canonical token ownership:
Direct consumer compatibility:
Legacy owner result:
Documentation guard:
Proof result:
Continuation required: yes | no
Remaining family concerns:
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits, delegation, or workflow advancement;
- trusting supplied closure or prerequisite status without current implementation inspection;
- accepting relocation, forwarding, barrels, migrated imports, or green path guards as readiness;
- accepting used dependencies as outside orchestration;
- approving canonicalization/adoption/removal with open recursive closure;
- approving changed public contracts without direct-consumer compatibility review;
- approving persisted execution state in owner docs or roadmap;
- complete family verdict, broad unrelated audit, Git/PR analysis, or durable review records.
