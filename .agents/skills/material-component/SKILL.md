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
3. If an exact architect correction handoff is supplied, reopen only its named owner and downstream stages invalidated by that finding.
4. Otherwise run only the earliest incomplete stage according to `component-workflow.md`.
5. For a new family, run API contract first.
6. After API completes, run token and behavior workers in separate fresh contexts; they may run in parallel when isolated writes are safe.
7. Launch implementation and migration only when their gates require them; never combine their contexts.
8. Validate structured worker results and required artifact/proof existence at gates.
9. Preserve operator observations and correction findings without inventing causes or fixes.
10. Stop at architect handoff. Do not run an independent coding-agent semantic review or claim PR/CI/merge readiness.

The orchestrator must not design API/tokens/behavior, inspect m3e semantics, implement code, migrate consumers, semantically review the family, or update roadmap completion state.

## Resume invariants

- A new contract artifact is durable only when its worker returned `complete`; blocked workers must not leave new partial contract files.
- Existing completed contracts are not rerun because a fresh agent lacks prior chat context.
- An architect correction handoff keeps its named stage invalid until that corrected worker returns `complete`; if the run is interrupted, the same handoff must be supplied again.
- An interrupted implementation resumes inside the implementation worker from current family files; it does not reopen contracts.
- Do not rewrite already-correct contracts/docs or regenerate unrelated proof merely to normalize output during a correction.
- If current repository state is ambiguous enough that the next stage cannot be determined mechanically, return `needs-architect` instead of rerunning the whole pipeline.
- After two unsuccessful correction rounds for the same underlying problem, return to the architect.

## Handoff shape

```text
family: <canonical family>
owner: <api-contract | token-contract | behavior-contract | implementation | migration | architect>
finding: <one exact defect>
affected scope: <concise contract/proof/consumer scope>
operator observation: none | <lossless factual observation>
```

Pass this block unchanged to the targeted worker. Do not turn a focused correction into a fresh family audit.

## Final report

```text
MATERIAL COMPONENT RESULT
input component: <name>
canonical family: <family>
api contract: complete | blocked | unchanged
token contract: complete | blocked | unchanged | return-to-api-contract
behavior contract: complete | blocked | unchanged | return-to-api-contract
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
- Running token/behavior before API is complete for a new/reopened API contract.
- Reintroducing a combined Material definition worker.
- Combining standalone implementation and consumer migration.
- Re-running completed stages without an exact correction owner or structural incompleteness.
- Using a full fresh pipeline as a substitute for missing prior-chat context.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Performing stage-owned reasoning in the orchestrator.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
