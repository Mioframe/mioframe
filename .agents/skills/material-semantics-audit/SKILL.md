---
name: material-semantics-audit
description: 'Internal read-only role for auditing only the public API, native semantics, accessibility, state ownership, extensions, dependencies, consumers, and proof for a bounded Material concern set. Use only when material-component delegates this lane after the canonical target slice is locked.'
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
- dependency classification and direction;
- public exports, representative consumers, compatibility paths, and obsolete owners;
- unit, component, browser, consumer, and verification evidence relevant to these concerns.

For each concern return current behavior, owner, evidence, candidate classification, exact mismatch or evidence gap, and correction owner.

## Evidence discipline

- Existing tests, comments, consumers, snapshots, and green CI are evidence only.
- Reuse independently locked target claims unless new contradictory evidence appears.
- Do not re-fetch or re-derive unrelated official facts.
- Do not count or inventory files outside the delegated owners and representative consumers.
- A known defect in a project extension prevents `project-extension` completion.

## Result

Return a concise structured result, without narrative review history:

```text
MATERIAL ROLE RESULT
Role: semantics-audit
Family:
Concern set:
Status: complete | blocked
Findings: <consolidated, maximum 12>
Dependency classifications:
Consumer impact:
Proof classifications:
External lane blockers: none | token | web | foundation | <exact blocker>
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits or delegation;
- canonical-target changes;
- token graph or motion-route inventory;
- selecting or implementing a correction unit;
- auditing the complete family when the delegated concern set is bounded;
- repeating confirmed source research without contradictory evidence;
- durable audit or review-history documents.