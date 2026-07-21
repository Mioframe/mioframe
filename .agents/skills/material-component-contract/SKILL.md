---
name: material-component-contract
description: 'Internal Material stage used only by material-component to synthesize one concern plan, dependency inventory, required target slices, and selected specialist audit results into a bounded correction contract and proof plan before independent review.'
---

# Material component contract

Internal stage only. Follow the canonical component workflow and token architecture.

## Inputs

Receive:

- locked task and PR scope;
- concern plan;
- complete required direct-dependency inventory;
- completed target slices required by that plan;
- completed selected results from `material-semantics-audit`, `material-token-audit`, and/or `material-web-audit`;
- current repository ref and owning family contract.

Do not require an unselected lane. Block when a required lane is missing, a selected result is incomplete, target/audit isolation failed, dependency ownership is unknown, or production work preceded the gate.

## Responsibility

Synthesize only the delegated concern set:

- applicable target/source decisions;
- alignment, dependency, and proof classifications;
- owner and blast radius;
- dependency closure and exact prerequisites;
- durable public/token/style/motion contract facts affected by the objective;
- highest-priority complete correction unit;
- proof lane, expected failing observation, compatibility/visual/operator impact, and completion condition;
- remaining gaps and external-lane blockers.

Do not run another broad current-state audit or repeat accepted source research. Validate role claims against the bounded repository evidence and challenge only contradictions, unsupported generalizations, missing ownership, or missing proof.

## Dependency closure

For every dependency required by the supported correction/public surface record:

```text
DEPENDENCY
Contract:
Current owner:
Classification: canonical-foundation | canonical-family | temporary-legacy-material | project-extension | generic-foundation
Readiness: ready | defective | missing | parallel-owner
Required proof:
Replacement obligation: none | foundation prerequisite | canonical-family prerequisite | remove/defer extension
```

A new canonical owner, owner migration, adoption, or aligned-family claim requires every required dependency to be ready and singly owned.

A required temporary legacy Material dependency or missing cross-family contract becomes an exact blocking `material-foundation` prerequisite. A dependency owned by another official component family requires that family's ready public contract; do not move it into foundation merely for convenience.

Select the smallest coherent currently required prerequisite. Do not require speculative foundation work.

## Correction unit

Select the smallest complete highest-priority unit allowed by `component-development.md`.

```text
CORRECTION UNIT
Gap:
Affected scenarios:
Canonical expected behavior:
Current defect:
Implementation owner:
Dependencies and blast radius:
Dependency closure: closed | blocked
Foundation prerequisite: none | <exact contract>
Canonical-family prerequisite: none | <exact contract>
Required concern lanes:
Primary proof lane:
Prepared failing observation:
Affected token graph: none | <exact bounded slice>
Affected Web/motion contract: none | <exact concern>
Compatibility impact:
Visible impact:
Operator acceptance required: yes | no
Completion condition:
```

Do not bypass a higher-priority blocker affecting the same PR-owned public surface. Styling or motion cannot proceed on an invalid token graph. Component implementation cannot proceed while a required prerequisite is pending or blocked.

## Documentation

Write current contract truth only:

- affected target/source decisions;
- current classification and owner;
- dependency closure and prerequisite status;
- durable public/token/style/motion contract;
- proof obligation;
- correction unit;
- remaining gaps.

Do not copy exact graph/route inventories, shell transcripts, reviewer narratives, round history, or unrelated confirmed claims into the README.

Set workflow stage to `contract-review` and next gate to independent correction contract review.

## Exit gate

Pass only when every required selected lane is complete, every required dependency has an explicit owner/classification/readiness, contradictions are resolved or explicitly blocking, the correction unit is highest-priority and bounded, prerequisites are exact, proof and compatibility decisions are locked, and the package is ready for one independent contract review.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: contract
Concern plan:
Status: complete | blocked
Target slices:
Selected audit results:
Classifications:
Dependency closure:
Foundation prerequisite:
Canonical-family prerequisite:
Current correction unit:
Proof lane:
External lane blockers:
Remaining gaps:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production/proof/story/consumer edits;
- broad family audit or target research;
- requiring unselected concern lanes;
- deriving target from existing behavior;
- accepting unknown, temporary legacy, defective, or parallel required dependencies for canonical ownership/adoption;
- moving another component family into foundation;
- exact implementation-route ledgers or review history in documentation;
- lower-priority correction around a blocker;
- roadmap advancement or another stage invocation;
- duplicate contracts, registries, checklists, scorecards, or progress ledgers.
