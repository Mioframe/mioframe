---
name: material-component-review
description: 'Independent read-only review for one Material component or foundation correction. A fresh isolated correction-final reviewer is mandatory before owner readiness.'
---

# Material correction review

Use as an optional `contract-gate` when the root requests independent validation of a high-risk locked contract, and as the mandatory `correction-final` after implementation and focused proof. This skill supports component and foundation owners.

## Independence

Run only in a fresh isolated read-only context that did not design, implement, patch, or narratively supervise the correction. The reviewer receives structured inputs and selected evidence, not the implementer's chain of reasoning or preferred conclusion.

Required context declaration:

```text
Review context: fresh-isolated-read-only
Implementation context reused: no
Repository writes available: no
```

If isolation is unavailable, return `not-run` with checkpoint reason `isolated-review-context-unavailable`. If a required tool or evidence source is unavailable, return `not-run` with the exact corresponding checkpoint reason. Do not review in the root or implementation context.

## Inputs

Receive:

- owner kind, family/domain, root invocation, and correction unit;
- supported scenarios/platforms and root-locked contract;
- selected source evidence;
- claimed dependency inventory and continuation stack;
- implementation result and changed owner set for `correction-final`;
- focused proof and direct-consumer inventory.

All supplied claims are untrusted. Independently inspect current implementations, imports, injected dependencies, styles, token declarations/references, exports, every direct consumer of changed public contracts or extensions, legacy-owner state, documentation, and guards.

## Stack gate

Confirm that the reviewed owner is the current deepest unfinished owner. A parent correction cannot pass while a deeper child owner remains unresolved.

The stack entry may be popped only after `correction-final` returns `complete`. `contract-gate: complete` authorizes the locked contract only; it is not readiness.

## Closure gates

Before returning `complete`:

- reconcile every `Known gaps`, `unresolved`, approximation, temporary compatibility, or future-correction statement in the owner README and current implementation;
- classify each as explicitly unsupported outside the claimed surface, a required open gap that keeps the owner on the stack, or an exact external blocker;
- reject an empty child stack while a claimed/supported scenario still has an unresolved implementation, motion, accessibility, platform, or proof gap;
- for any public value where `undefined`, `false`, `0`, boundary values, or invalid/out-of-range values have distinct meaning, enumerate those states and inspect every direct consumer for truthiness, coercion, range, and sentinel mismatches;
- require focused proof for every distinct supported value state and the documented invalid-value behavior;
- treat every component that consumes a created, moved, forwarded, or behaviorally changed foundation/family owner as part of that owner's compatibility scope, regardless of the consumer's official family label;
- reject readiness when a changed-owner consumer has a focused or full-verification regression.

## Contract gate

Verify:

- code-first reconstruction and exact owner boundary;
- complete actual dependencies and executable nested prerequisites;
- child owner readiness from independent reviews;
- correct public API, semantics, lifecycle, accessibility, token ownership, platform behavior, and direct-consumer scope;
- relocation/forwarding/barrel/import migration is not treated as readiness;
- the correction is the highest-priority deepest-owner work.

Return `complete`, `blocked`, or `not-run`.

## Correction final

Verify the implemented owner correction against current code:

- locked contract and supported scenarios;
- recursive child readiness;
- canonical token declarations and dependency direction;
- API/native/accessibility/state semantics and lifecycle;
- all direct consumers of changed contracts or extensions, including consumers in other official Material families;
- compatibility and legacy-owner disposition;
- required unit, browser, consumer, visual, and operator proof;
- durable README accuracy;
- relevant Material guards.

Known defects, unresolved required gaps, sentinel/value-state incompatibilities, incompatible consumers, stale contract documentation, insufficient available proof, missing browser behavior proof, changed-owner consumer regressions, or legacy-owned canonical tokens return `blocked` with consolidated findings. Unavailable required tooling/evidence returns `not-run` with the exact checkpoint reason.

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
Status: complete | blocked | not-run
Deepest owner confirmed: yes | no
Gate result:
Actual dependency closure:
Prerequisite owner readiness:
Canonical token ownership:
Public contract and semantics:
Unresolved gap reconciliation:
Sentinel/value-state compatibility:
Changed-owner consumer compatibility:
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
- accepting a parent while a deeper child owner remains unfinished;
- accepting an owner with an unresolved required gap or unverified sentinel/value-state semantics;
- excluding a direct consumer because it belongs to another official Material family;
- accepting relocation, forwarding, barrels, migrated imports, or green guards as readiness;
- accepting changed public contracts without every enumerable direct consumer;
- returning a nested operator command;
- complete-family verdict or Git/PR analysis.
