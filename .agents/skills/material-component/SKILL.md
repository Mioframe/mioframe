---
name: material-component
description: 'Use with one official Material component name to orchestrate canonical contract extraction, implementation plus migration, and fresh independent review before architect-owned PR CI.'
---

# Material component

Accept one official Material component name plus any concrete operator observations about visual, motion, accessibility, interaction, geometry, or behavior.

The operator invokes this once. Do not require separate stage commands.

## Authority

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. The workflow document owns the complete state machine; this skill stays mechanical.

## Normal path

```text
material-component-contract
  → material-component-implementation
  → material-component-review
  → architect / PR / exact-head CI
```

Each role runs in a fresh isolated worker context. Review must be independent from contract and implementation authors.

If isolated workers are unavailable, stop rather than simulating independence in one context.

## Orchestrator boundary

The orchestrator may only:

- resolve the canonical family;
- launch the three worker roles;
- pass applicable rules and canonical file paths;
- preserve exact operator observations;
- preserve one exact correction finding between workers;
- validate structured terminal results;
- route correction to contract, implementation, or architect;
- stop on a genuine blocker;
- hand a successfully reviewed result to the architect.

It must not design the Material API, inspect m3e behavior, implement code, migrate consumers, review semantics, invent causes from observations, or run broad verification to duplicate PR CI.

## Worker handoffs

Keep handoffs compact. Pass current repository files and this correction capsule when needed:

```text
family: <canonical-family>
origin: contract | implementation | review | operator | CI
owner: contract | implementation | architect
finding: <exact observable or contract defect>
affected contract/proof: <concise scope>
operator observation: none | <lossless factual observation>
```

Do not pass hidden reasoning, previous narrative reports, Git/PR history, or copied source encyclopedias between workers.

## Correction routing

Use only:

```text
contract finding
  → fresh contract
  → implementation if runtime/consumers may be affected
  → fresh review

implementation/migration finding
  → fresh implementation
  → fresh review

architecture/ownership finding
  → architect-handoff
  → resume earliest invalidated worker
  → fresh review
```

Do not rerun contract extraction for a purely local implementation correction.

After two unsuccessful correction rounds for the same underlying problem, escalate to architecture rather than accumulating patches.

## Dependencies

A Material family may depend on another canonical Material family through its public API.

If the implementation proves that a required dependency family is not canonical/complete, process that dependency through the same three-role workflow before resuming the parent. Detect dependency cycles and escalate them to architecture rather than creating recursive ownership.

Do not persist a dependency revision graph.

## Verification

The implementation worker owns focused verifier-managed feedback. The orchestrator does not run broad `pnpm verify`/`verify:release` merely to duplicate exact-head GitHub CI.

Required contract/browser/visual/migration proof must exist before handoff; CI does not replace missing proof.

## Final report

```text
MATERIAL COMPONENT RESULT
input component: <name>
canonical family: <family>
contract: complete | blocked
implementation + migration: complete | blocked | not-run
independent review: compliant | compliant-with-listed-risks | blocked | not-run
correction routes: none | <summary>
operator observations: none | <status>
focused verification: <summary>
remaining blocker: none | <exact blocker>
PR/CI readiness: ready | blocked
next action: hand to architect for PR/CI | <exact required action>
```

## Forbidden

- Requiring five legacy stage workers or durable DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW logs.
- Reusing one worker context for contract, implementation and review.
- Splitting consumer migration into a mandatory separate worker.
- Letting m3e or legacy consumers define the canonical public contract.
- Performing stage-owned reasoning in the orchestrator.
- Re-running unaffected stages without an exact correction reason.
- Retrying a genuine blocker without new evidence.
- Dropping or reinterpreting concrete operator observations.
- Depending on Git/PR/check state for family correctness.
- Claiming merge readiness.
