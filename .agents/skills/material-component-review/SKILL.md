---
name: material-component-review
description: 'Independent read-only review for one Material component or foundation owner pass. One fresh reviewer may re-review one correction pass before owner readiness.'
---

# Material owner review

Use as an optional `contract-gate` for a high-risk locked contract and as mandatory `correction-final` after one owner convergence pass.

## Independence

The initial review runs in a fresh isolated read-only context that did not design, implement, patch, or supervise the owner pass. It receives structured inputs and selected evidence, not the implementer's reasoning transcript.

Required initial declaration:

```text
Review context: fresh-isolated-read-only
Implementation context reused: no
Repository writes available: no
```

When the first verdict is `blocked`, the same reviewer context may be resumed once after the same isolated implementation context applies the consolidated correction findings. This remains independent because the reviewer never writes production files. Do not create a new reviewer merely for the second pass unless the original context is unavailable/exhausted or the architecture contract changed.

If isolation is unavailable, return `not-run` with `isolated-review-context-unavailable`. Do not review in root or implementation context.

## Inputs

Receive:

- owner kind, family/domain, root invocation, and owner-pass contract;
- supported scenarios/platforms and locked source decisions;
- selected source evidence;
- claimed dependency inventory and continuation stack;
- implementation pass result and changed owner set;
- focused proof and changed-owner consumer inventory;
- for re-review, the previous consolidated blockers and correction result.

All claims are untrusted. Independently inspect current implementation, imports, dependencies, styles, tokens, exports, consumers, legacy state, documentation, guards, and proof.

Reuse already inspected unchanged evidence during the re-review. Reinspect the corrected findings, affected contracts/consumers, and any newly changed paths. Do not repeat full owner research unless the correction changed architecture, supported surface, dependencies, or source decisions.

## Stack and closure gates

Confirm the reviewed owner is the deepest unfinished owner. A parent cannot pass while a deeper child remains unresolved.

Before `complete`:

- reconcile every `Known gaps`, `unresolved`, approximation, temporary compatibility, or future-correction statement;
- classify each as outside supported surface, a required open gap, or an exact external blocker;
- reject an empty child stack while a supported scenario has an unresolved implementation, motion, accessibility, platform, or proof gap;
- enumerate distinct sentinel/boundary/invalid value semantics and inspect every direct consumer for mismatches;
- require focused proof for supported value states and documented invalid behavior;
- include every consumer of a created, moved, forwarded, or behaviorally changed owner, including consumers in other official families;
- reject changed-owner consumer regressions.

Relocation, forwarding, barrels, migrated imports, and green guards are not readiness.

## Review cadence

Initial correction-final review:

- verify the complete consolidated owner-pass contract;
- return all actionable in-owner findings together, not one issue at a time;
- distinguish new prerequisite/architecture failures from ordinary in-owner corrections.

Re-review after correction:

- verify every previous blocker;
- inspect newly changed paths and affected proof;
- preserve accepted unchanged findings from the initial review;
- return `complete`, or return consolidated remaining findings and require root architecture/context reassessment.

Only `correction-final: complete` permits the root to pop this owner.

## Result

```text
MATERIAL CORRECTION REVIEW
Owner kind: component | foundation
Family/domain:
Invocation scope:
Review scope: contract-gate | correction-final
Review pass: initial | correction-recheck
Owner pass:
Review context: fresh-isolated-read-only | resumed-isolated-read-only
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
Checkpoint reason: none | isolated-review-context-unavailable | context-exhausted | runtime-exhausted | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- repository edits or workflow advancement;
- review by root or implementation context;
- emitting findings one at a time when they can be consolidated;
- repeating unchanged full owner research during correction re-review;
- trusting supplied dependency, proof, or readiness claims;
- accepting a parent with an unfinished child;
- accepting unresolved required gaps or unverified value semantics;
- excluding consumers because they belong to another official family;
- returning a nested operator command;
- complete-family verdict or Git/PR analysis.
