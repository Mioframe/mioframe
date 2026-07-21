---
name: material-component-contract
description: 'Internal Material stage used only by material-component to synthesize one concern plan, required target slices, and selected specialist audit results into a bounded correction contract and proof plan before independent review.'
---

# Material component contract

Internal stage only. Follow the canonical component workflow and token architecture.

## Inputs

Receive:

- locked task and PR scope;
- concern plan;
- completed target slices required by that plan;
- completed selected results from `material-semantics-audit`, `material-token-audit`, and/or `material-web-audit`;
- current repository ref and owning family contract.

Do not require an unselected lane. Block when a required lane is missing, a selected result is incomplete, target/audit isolation failed, or production work preceded the gate.

## Responsibility

Synthesize only the delegated concern set:

- applicable target/source decisions;
- alignment, dependency, and proof classifications;
- owner and blast radius;
- durable public/token/style/motion contract facts affected by the objective;
- highest-priority complete correction unit;
- proof lane, expected failing observation, compatibility/visual/operator impact, and completion condition;
- remaining gaps and external-lane blockers.

Do not run another broad current-state audit or repeat accepted source research. Validate role claims against the bounded repository evidence and challenge only contradictions, unsupported generalizations, or missing proof.

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

Do not bypass a higher-priority blocker affecting the same PR-owned public surface. Styling or motion cannot proceed on an invalid token graph.

## Documentation

Write current contract truth only:

- affected target/source decisions;
- current classification and owner;
- durable public/token/style/motion contract;
- proof obligation;
- correction unit;
- remaining gaps.

Do not copy exact graph/route inventories, shell transcripts, reviewer narratives, round history, or unrelated confirmed claims into the README.

Set workflow stage to `contract-review` and next gate to independent correction contract review.

## Exit gate

Pass only when every required selected lane is complete, contradictions are resolved or explicitly blocking, ownership is explicit, the correction unit is highest-priority and bounded, proof and compatibility decisions are locked, and the package is ready for one independent contract review.

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
- exact implementation-route ledgers or review history in documentation;
- lower-priority correction around a blocker;
- roadmap advancement or another stage invocation;
- duplicate contracts, registries, checklists, scorecards, or progress ledgers.
