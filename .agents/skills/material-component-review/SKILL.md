---
name: material-component-review
description: 'Mandatory independent read-only review for one Material component or foundation correction. Only a fresh isolated reviewer may accept owner readiness.'
---

# Material correction review

Review one locked correction as `contract-gate` before implementation or `correction-final` after implementation and focused proof. This skill supports component and foundation owners.

## Independence

Run only in a fresh isolated read-only context that did not design, implement, patch, or narratively supervise the correction. The reviewer receives structured inputs and selected evidence, not the implementer's chain of reasoning or preferred conclusion.

Required context declaration:

```text
Review context: fresh-isolated-read-only
Implementation context reused: no
Repository writes available: no
```

If these conditions are unavailable, return `not-run` with checkpoint reason `isolated-review-context-unavailable`. Do not review in the root or implementation context.

## Inputs

Receive:

- owner kind, family/domain, root invocation, and correction unit;
- supported scenarios/platforms and locked contract;
- selected source evidence;
- claimed dependency inventory and continuation stack;
- implementation result and changed owner set;
- focused proof and direct-consumer inventory.

All supplied claims are untrusted. Independently inspect current implementations, imports, injected dependencies, styles, token declarations/references, exports, every direct consumer of changed public contracts or extensions, legacy-owner state, documentation, and guards.

## Stack gate

Confirm that the reviewed owner is the current deepest unfinished owner. A parent correction cannot pass while a deeper child owner remains unresolved.

The stack entry may be popped only after `correction-final` returns `complete`. `contract-gate: complete` authorizes implementation only; it is not readiness.

## Contract gate

Verify:

- code-first reconstruction and exact owner boundary;
- complete actual dependencies and executable nested prerequisites;
- child owner readiness from independent reviews;
- correct public API, semantics, lifecycle, accessibility, token ownership, platform behavior, and direct-consumer scope;
- relocation/forwarding/barrel/import migration is not treated as readiness;
- the correction is the highest-priority deepest-owner work.

Return `complete`, `blocked`, `not-enough-evidence`, or `not-run`.

## Correction final

Verify the implemented owner correction against current code:

- locked contract and supported scenarios;
- recursive child readiness;
- canonical token declarations and dependency direction;
- API/native/accessibility/state semantics and lifecycle;
- all direct consumers of changed contracts or extensions;
- compatibility and legacy-owner disposition;
- required unit, browser, consumer, visual, and operator proof;
- durable README accuracy;
- relevant Material guards.

Known defects, incompatible consumers, stale contract documentation, missing browser behavior proof, or legacy-owned canonical tokens block readiness even when focused tests pass.

A passed correction does not complete the root family. It only permits the root orchestrator to pop this exact owner and continue.

## Result

```text
MATERIAL CORRECTION REVIEW
Owner kind: component | foundation
Family/domain:
Invocation scope:
Review scope: contract-gate | correction-final
Correction unit:
Review context: fresh-isolated-read-only
Implementation context reused: no
Repository writes available: no
Status: complete | blocked | not-enough-evidence | not-run
Deepest owner confirmed: yes | no
Gate result:
Actual dependency closure:
Prerequisite owner readiness:
Canonical token ownership:
Public contract and semantics:
Direct consumer compatibility:
Legacy owner result:
Documentation result:
Proof result:
Stack transition authorized: yes | no
Continuation required: yes | no
Deepest unfinished owner: none | <exact owner>
Blockers: none | <consolidated findings>
Checkpoint reason: none | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- repository edits or workflow advancement;
- review by the root or implementation context;
- trusting supplied dependency, proof, or readiness claims;
- accepting a parent while a deeper owner remains unfinished;
- accepting relocation, forwarding, barrels, migrated imports, or green guards as readiness;
- accepting changed public contracts without every enumerable direct consumer;
- returning a nested operator command;
- complete-family verdict or Git/PR analysis.
