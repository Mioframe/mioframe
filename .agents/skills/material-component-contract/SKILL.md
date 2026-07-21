---
name: material-component-contract
description: 'Internal Material procedure used only by material-component to synthesize one concern plan, dependency inventory, required target slices, and selected specialist results into a bounded correction contract and proof plan before independent review.'
---

# Material component contract

Run inside the `material-component` orchestrator context. This is not an independent agent entry point because correction selection shares the family orientation, accepted evidence, dependency graph, and continuation state.

## Inputs

Receive:

- family, mode, current objective, required scenarios, and non-goals;
- current family orientation and workflow state;
- concern plan;
- complete required direct-dependency inventory for the affected surface;
- completed target slices required by that plan;
- completed selected results from `material-semantics-audit`, `material-token-audit`, and/or `material-web-audit`;
- owning family contract and current implementation evidence.

Do not require an unselected lane. Block when a required lane is missing, a selected result is incomplete, target/audit isolation failed, dependency ownership is unknown, or production work preceded the gate.

## Responsibility

Synthesize only the selected concern set:

- applicable target and source decisions;
- alignment, dependency, and proof classifications;
- owner and blast radius;
- dependency closure and exact prerequisites;
- durable public, token, style, and motion facts affected by the objective;
- highest-priority complete correction unit;
- proof lane, expected failing observation, compatibility and visual impact, operator requirement, and completion condition;
- remaining family gaps and external-lane blockers.

Do not run another broad current-state audit or repeat accepted source research. Validate specialist claims against bounded repository evidence and challenge only contradictions, unsupported generalizations, missing ownership, or missing proof.

## Dependency closure

For every dependency required by the affected supported surface record:

```text
DEPENDENCY
Contract:
Current owner:
Classification: canonical-foundation | canonical-family | temporary-legacy-material | project-extension | generic-foundation
Readiness: ready | defective | missing | parallel-owner
Required proof:
Replacement obligation: none | foundation prerequisite | official-family prerequisite | remove/defer extension
```

A new canonical owner, owner migration, adoption, or aligned-family claim requires every required dependency to be ready and singly owned.

A required temporary legacy Material dependency or missing family-agnostic cross-family contract becomes an exact blocking `material-foundation` prerequisite. A dependency owned by another official component family requires that family's ready public contract. Do not move it into foundation.

Select the smallest coherent currently required prerequisite. Do not require speculative foundation work. Detect and report prerequisite cycles.

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
Official-family prerequisite: none | <exact contract>
Required concern lanes:
Primary proof lane:
Prepared failing observation:
Affected token graph: none | <exact bounded slice>
Affected Web/motion contract: none | <exact concern>
Compatibility impact:
Visible impact:
Operator comparison required: yes | no
Completion condition:
```

Do not bypass a higher-priority blocker affecting the same supported surface. Styling or motion cannot proceed on an invalid token graph. Implementation cannot proceed while a required prerequisite is pending or blocked.

## Documentation

Write current contract truth only:

- affected target/source decisions;
- current classification and owner;
- dependency closure and prerequisite status;
- durable public/token/style/motion contract;
- proof obligation;
- correction unit;
- remaining gaps.

Do not copy exact graph or route inventories, shell transcripts, reviewer narratives, round history, or unrelated confirmed claims into the README.

Set workflow stage to `contract-review` and next action to independent correction contract review. Return control to the orchestrator; do not invoke another stage.

## Exit gate

Pass only when every required selected lane is complete, every required dependency has explicit ownership and readiness, contradictions are resolved or exactly blocking, the correction unit is highest-priority and bounded, prerequisites are exact, proof and compatibility decisions are locked, and the package is ready for one independent review.

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
Official-family prerequisite:
Current correction unit:
Proof lane:
External lane blockers:
Remaining family gaps:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production, proof, story, or consumer edits;
- broad family audit or target research;
- requiring unselected concern lanes;
- deriving target from existing behavior;
- accepting unknown, temporary legacy, defective, cyclic, or parallel required dependencies for canonical ownership or adoption;
- moving another component family into foundation;
- implementation-route ledgers or review history in documentation;
- lower-priority correction around a blocker;
- roadmap advancement, stage invocation, Git operations, or publication workflow;
- duplicate contracts, registries, checklists, scorecards, or progress ledgers.
