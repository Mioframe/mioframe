---
name: material-component
description: 'Use for one official Material family to resume its focused API/token/behavior contracts, standalone implementation, and required migration without rebuilding completed stages.'
---

# Material component

Accept one official Material component name plus any exact architect correction handoff and concrete operator observations.

The operator may invoke this repeatedly. Repeated invocation resumes current repository state; it is not permission to regenerate completed stages.

## Authority

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. That document owns sequencing, source readiness, resume rules, correction routing, and completion.

This skill owns orchestration only.

## Execute

1. Resolve the canonical Material family.
2. Inspect current family artifacts/runtime/consumer migration state mechanically.
3. If an exact architect correction handoff is supplied, reopen only its named owner and downstream invalidated stages.
4. Otherwise run only the earliest structurally incomplete stage according to `component-workflow.md`.
5. Launch every role in a fresh isolated worker context.
6. For a new family, run the three independent contract workers in parallel only when isolated writes are safe; otherwise run them separately.
7. Validate structured worker results and required artifact/proof existence at gates.
8. Preserve operator observations and correction findings without inventing causes or fixes.
9. Skip migration when an already-migrated family correction does not change consumer usage and legacy ownership is already removed.
10. Stop at architect handoff. Do not run an independent coding-agent semantic review or claim PR/CI/merge readiness.

The orchestrator must not design API/tokens/behavior, inspect m3e semantics, implement code, migrate consumers, semantically review the family, or update roadmap completion state.

## Resume invariants

- Existing `contract.ts`, `tokens.css`, and `BEHAVIOR.md` are durable completed-stage artifacts unless an exact correction handoff reopens their owner.
- Do not rerun a completed contract because a fresh agent lacks prior chat context.
- Do not rewrite already-complete behavior/docs merely to normalize prose during an implementation correction.
- If current repository state is ambiguous enough that the next stage cannot be determined mechanically, return `needs-architect` instead of rerunning the whole pipeline.
- After two unsuccessful correction rounds for the same underlying problem, return to the architect.

## Handoff shape

```text
family: <canonical family>
owner: <api-contract | token-contract | behavior-contract | implementation | migration | architect>
finding: <exact defect>
affected scope: <concise contract/proof/consumer scope>
operator observation: none | <lossless factual observation>
```

## Final report

```text
MATERIAL COMPONENT RESULT
input component: <name>
canonical family: <family>
api contract: complete | blocked | unchanged
token contract: complete | blocked | unchanged
behavior contract: complete | blocked | unchanged
standalone implementation: complete | blocked | unchanged | not-run
migration: complete | not-required | blocked | unchanged | not-run
correction route: none | <owner and scope>
operator observations: none | <status>
focused verification: <summary>
remaining blocker: none | <exact blocker>
next action: hand to architect | <exact required correction>
```

## Forbidden

- Reusing one worker context for multiple responsibilities.
- Reintroducing a combined Material definition worker.
- Combining standalone implementation and consumer migration.
- Re-running completed stages without an exact correction owner or structural incompleteness.
- Using a full fresh pipeline as a substitute for missing prior-chat context.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Performing stage-owned reasoning in the orchestrator.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
