---
name: material-component
description: 'Use with one official Material component name to orchestrate three focused Material contracts, standalone implementation, separate migration, and fresh independent review before architect-owned PR CI.'
---

# Material component

Accept one official Material component name plus any concrete operator observations about visual, motion, accessibility, interaction, geometry, or behavior.

The operator invokes this once. Do not require separate stage commands.

## Authority

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. The workflow document owns orchestration; this skill stays mechanical.

## Normal path

```text
material-component-api-contract       ┐
material-component-token-contract     ├─→ contract-ready gate
material-component-behavior-contract  ┘
                                          ↓
                          material-component-implementation
                                          ↓
                             material-component-migration
                                          ↓
                              material-component-review
                                          ↓
                              architect / PR / exact-head CI
```

Every role runs in a fresh isolated worker context. The three contract workers may run in parallel when supported because they own separate artifacts. Review must be independent from every authoring worker.

If isolated workers are unavailable, report the workflow blocked rather than simulating independent stages in one context.

## Orchestrator boundary

The orchestrator may only:

- resolve the canonical family;
- launch the three contract workers;
- mechanically validate that all three contract results are complete and their artifacts exist;
- launch standalone implementation only after that gate;
- launch migration only after standalone implementation is complete;
- launch fresh independent review only after migration is complete;
- preserve exact operator observations and exact correction findings;
- route corrections to the exact worker owner;
- stop on a genuine blocker;
- hand a successfully reviewed result to the architect.

It must not design API/tokens/behavior, synthesize the three contracts, inspect m3e semantics, implement code, migrate consumers, perform semantic review, or invent causes from observations.

## Contract workers

Each contract worker uses Material 3 MCP as the sole official Material documentation source and owns one artifact:

```text
api-contract      → contract.ts
 token-contract    → tokens.css
behavior-contract → BEHAVIOR.md
```

Do not pass one contract worker's narrative reasoning to another. The contract-ready gate is mechanical, not another review/synthesis stage.

## Worker handoffs

Keep handoffs compact:

```text
family: <canonical-family>
origin: api-contract | token-contract | behavior-contract | implementation | migration | review | operator | CI
owner: api-contract | token-contract | behavior-contract | implementation | migration | architect
finding: <exact observable or contract defect>
affected contract/proof: <concise scope>
operator observation: none | <lossless factual observation>
```

Do not pass hidden reasoning, previous narrative reports, Git/PR history, or copied source encyclopedias between workers.

## Correction routing

Use exact ownership:

```text
api-contract finding
  → fresh api-contract
  → implementation
  → migration when public consumer shape changed
  → review

token-contract finding
  → fresh token-contract
  → implementation
  → review

behavior-contract finding
  → fresh behavior-contract
  → implementation
  → review

implementation finding
  → fresh implementation
  → review

migration finding
  → fresh migration
  → review

architecture/ownership finding
  → architect-handoff
  → resume earliest invalidated worker
  → review
```

Do not rerun unaffected contract workers. After two unsuccessful correction rounds for the same underlying problem, escalate to architecture rather than accumulating patches.

## Dependencies

A Material family may depend on another canonical Material family only through its public API.

If standalone implementation proves a required dependency family is not canonical/complete, process that dependency through the same workflow before resuming the parent. Detect dependency cycles and escalate them to architecture rather than creating recursive ownership.

Do not persist a dependency revision graph.

## Verification

Implementation and migration workers own their focused verifier-managed feedback. The orchestrator does not run broad local `pnpm verify`/`verify:release` merely to duplicate exact-head GitHub CI.

Required contract/browser/visual/migration proof must exist before handoff; CI does not replace missing semantic proof.

## Final report

```text
MATERIAL COMPONENT RESULT
input component: <name>
canonical family: <family>
api contract: complete | blocked
token contract: complete | blocked
behavior contract: complete | blocked
standalone implementation: complete | blocked | not-run
migration: complete | blocked | not-run
independent review: compliant | compliant-with-listed-risks | blocked | not-run
correction routes: none | <summary>
operator observations: none | <status>
focused verification: <summary>
remaining blocker: none | <exact blocker>
PR/CI readiness: ready | blocked
next action: hand to architect for PR/CI | <exact required action>
```

## Forbidden

- Reintroducing a combined contract worker that owns API, tokens and behavior together.
- Adding mandatory GUIDANCE/SOURCES/design/architecture/contract-review stages to the normal path.
- Reusing one worker context for multiple responsibilities.
- Combining standalone implementation and consumer migration.
- Letting m3e, legacy code or current consumer demand define Material contracts.
- Performing stage-owned reasoning in the orchestrator.
- Re-running unaffected stages without an exact correction reason.
- Retrying a genuine blocker without new evidence.
- Dropping or reinterpreting concrete operator observations.
- Depending on Git/PR/check state for family correctness.
- Claiming merge readiness.