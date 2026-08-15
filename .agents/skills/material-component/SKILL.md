---
name: material-component
description: 'Use for one official Material family to orchestrate its focused definition, standalone implementation, migration, and independent review.'
---

# Material component

Accept one official Material component name plus any concrete operator observations about visual, motion, accessibility, interaction, geometry, behavior, or component usage.

The operator invokes this once. Do not require separate stage commands.

## Authority

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. That workflow document is the single owner of sequencing, gates, correction routing, dependency handling, and completion rules.

This skill owns orchestration only. Do not duplicate or reinterpret stage semantics here.

## Execute

1. Resolve the canonical Material family.
2. Follow `component-workflow.md` mechanically.
3. Launch every role in a fresh isolated worker context.
4. Run the four definition workers in parallel only when the runtime can safely isolate their independent file writes; otherwise run them separately without merging responsibilities.
5. Validate only structured worker results and required artifact existence at workflow gates.
6. Preserve exact operator observations and exact correction findings without inventing causes or fixes.
7. Route a correction only to the owner named by the workflow/result; do not rerun unaffected definition workers.
8. Stop on a genuine blocker or hand a successfully reviewed family to the architect for PR/exact-head CI.

The orchestrator must not design API/tokens/behavior/guidance, synthesize definition artifacts, inspect m3e semantics, implement code, migrate consumers, perform semantic review, or claim merge readiness.

## Handoffs

Pass only the minimum durable state needed by the next worker:

```text
family: <canonical-family>
origin: <worker | operator | CI>
owner: <target worker | architect>
finding: <exact observable, contract, or usage-guidance defect>
affected contract/proof: <concise scope>
operator observation: none | <lossless factual observation>
```

Use repository artifacts as handoffs. Do not pass hidden reasoning, previous narrative reports, Git/PR history, copied source encyclopedias, or unrelated intermediate logs between workers.

After two unsuccessful correction rounds for the same underlying problem, follow the workflow's architecture escalation instead of accumulating patches.

## Final report

```text
MATERIAL COMPONENT RESULT
input component: <name>
canonical family: <family>
api contract: complete | blocked
token contract: complete | blocked
behavior contract: complete | blocked
guidance: complete | blocked
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

- Reusing one worker context for multiple responsibilities.
- Reintroducing a combined Material definition worker.
- Combining standalone implementation and consumer migration.
- Letting m3e, legacy code, or current consumer demand define Material contracts or usage guidance.
- Performing stage-owned reasoning in the orchestrator.
- Re-running unaffected stages without an exact correction reason.
- Retrying a genuine blocker without new evidence.
- Dropping or reinterpreting concrete operator observations.
- Depending on Git/PR/check state for family correctness.
- Claiming merge readiness.
