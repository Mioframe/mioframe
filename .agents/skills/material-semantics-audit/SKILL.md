---
name: material-semantics-audit
description: 'Internal read-only role for auditing only the public API, native semantics, accessibility, state ownership, extensions, direct dependencies, consumers, and proof for a bounded Material concern set. Use only when material-component delegates this lane after the canonical target slice is locked.'
---

# Material semantics audit

Audit only the delegated concern set against the supplied locked target slice. Do not inspect token declarations, CSS motion details, or unrelated family concerns unless they are direct blockers for the delegated semantics.

## Inputs

Receive:

- family and exact concern set;
- locked canonical target claims for that concern set;
- required scenarios and platforms;
- current repository ref;
- explicit owners, consumers, and evidence paths to inspect;
- applicable repository instructions.

Do not broaden the scope. Report an external dependency instead of auditing another lane.

## Responsibility

Inspect only:

- public props, events, slots, defaults, invalid combinations, and normalization;
- native element, keyboard, form, disabled, focus, and event-propagation semantics;
- accessibility name, role, state, and platform behavior;
- semantic/transient state ownership and precedence;
- project extensions and their user scenarios;
- every direct imported or injected dependency required by the delegated public surface;
- dependency classification, direction, public/private access, readiness, known defects, and replacement obligation;
- public exports, representative consumers, compatibility paths, and obsolete owners;
- unit, component, browser, consumer, and verification evidence relevant to these concerns.

Classify each required dependency as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

Report as blockers for canonical ownership/adoption:

- required temporary legacy Material dependencies;
- another Material family used through a legacy or private path instead of a ready public contract;
- missing/unowned shared Material behavior;
- known-defective dependency behavior affecting the scenario;
- parallel active owners or compatibility wrappers that still implement behavior.

For each concern return current behavior, owner, evidence, candidate classification, exact mismatch or evidence gap, and correction owner.

## Evidence discipline

- Existing tests, comments, consumers, snapshots, and green CI are evidence only.
- Reuse independently locked target claims unless new contradictory evidence appears.
- Do not re-fetch or re-derive unrelated official facts.
- Do not count or inventory files outside the delegated owners and representative consumers.
- A known defect in a project extension prevents `project-extension` completion.
- Another official component family is not foundation merely because the audited family consumes it.

## Result

Return a concise structured result, without narrative review history:

```text
MATERIAL ROLE RESULT
Role: semantics-audit
Family:
Concern set:
Status: complete | blocked
Findings: <consolidated, maximum 12>
Required dependency findings:
Dependency classifications:
Dependency closure contribution: closed | blocked
Consumer impact:
Proof classifications:
External lane blockers: none | token | web | foundation | canonical-family | <exact blocker>
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits or delegation;
- canonical-target changes;
- token graph or motion-route inventory;
- selecting or implementing a correction unit;
- auditing the complete family when the delegated concern set is bounded;
- treating another component family as foundation;
- repeating confirmed source research without contradictory evidence;
- durable audit or review-history documents.
