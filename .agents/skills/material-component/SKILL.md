---
name: material-component
description: 'Use with one official Material component name to autonomously resume focused contracts, standalone implementation, and required migration from repository state.'
---

# Material component

Accept one official Material component name plus optional concrete operator observations.

The operator-facing command is always:

```text
material-component <name>
```

Do not require the operator to provide a stage, correction owner, previous worker report, or correction handoff. Repeated invocation resumes from repository state.

## Authority

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. That document owns sequencing, source readiness, compatibility checks, recovery state, correction routing, and completion.

This skill owns orchestration only.

## Execute

1. Resolve the canonical Material family.
2. Inspect current family artifacts/runtime/consumer migration state mechanically.
3. Read the family-local `.material-correction.json` recovery marker when it exists.
4. Run the current-rules compatibility gate from `component-workflow.md` before treating existing artifacts as reusable completed stages.
5. If a pending correction exists or the compatibility gate identifies an exact owner, run only that owner and downstream stages actually invalidated by the correction.
6. Otherwise run only the earliest missing/incomplete stage according to `component-workflow.md`.
7. For a new family, run API contract first.
8. After API completes, run token and behavior workers in separate fresh contexts; they may run in parallel when isolated writes are safe.
9. Launch implementation and migration only when their gates require them; never combine their contexts.
10. When any worker returns a correction route, persist that route to `.material-correction.json` before launching another worker or returning control. This makes interruption recoverable without chat history.
11. Clear `.material-correction.json` only after its targeted correction completes and no replacement correction is returned.
12. Validate structured worker results and required artifact/proof existence at gates.
13. Preserve concrete operator observations without inventing causes or fixes.
14. Stop at architect handoff. Do not run an independent coding-agent semantic review or claim PR/CI/merge readiness.

The orchestrator must not design API/tokens/behavior, inspect m3e semantics, implement code, migrate consumers, semantically review the family, or update roadmap completion state.

## Current-rules compatibility boundary

The compatibility gate is deliberately mechanical. It may detect explicit violations of current repository rules from current files, for example:

- wrong/missing mandatory artifact shape;
- renderer/private vocabulary inside public contracts;
- component token defaults declared on `:root` instead of the family block selector;
- `--m3e-*` inside public `tokens.css`;
- TypeScript token catalogues/generated token-name mapping machinery forbidden by current token rules;
- implementation/test/workflow prose inside `BEHAVIOR.md`;
- stale legacy workflow artifacts being treated as current completion state.

It must not decide whether a Material fact is semantically correct, infer undocumented Material requirements, inspect m3e behavior, or perform a hidden full family review. Semantic disagreement belongs to the focused owner worker or architect.

When mechanical incompatibilities exist in several stages at once, do not escalate merely because more than one owner is stale. Process the earliest owner in pipeline order, then rerun the compatibility gate:

```text
api-contract → token-contract → behavior-contract → implementation → migration
```

Token and behavior remain independently owned; this ordering is only a deterministic recovery priority when both already contain visible stale-rule violations. A corrected earlier owner may invalidate or eliminate later findings, so do not pre-plan the whole correction chain.

For the selected earliest owner, consolidate its visible mechanical violations into the internal correction marker and route it without asking the operator.

## Durable correction recovery

A pending correction is stored only while unresolved at:

```text
src/shared/ui/material/components/<family>/.material-correction.json
```

Shape:

```json
{
  "owner": "api-contract | token-contract | behavior-contract | implementation | migration",
  "finding": "one exact unresolved defect",
  "affectedScope": "concise contract/proof/consumer scope"
}
```

This file is transient recovery state, not a Material contract, design document, review artifact, history log, or completion record.

Rules:

- exactly one active owner at a time;
- keep the finding factual and minimal;
- no timestamps, hashes, counters, worker transcripts, hidden reasoning, Git/PR/CI state, or speculative fix;
- when several known defects share the same owner, consolidate them into one concise finding/scope rather than creating several markers;
- if a worker returns a different owner, replace the marker atomically before routing;
- if the targeted worker completes but returns another correction, replace rather than clear the marker;
- clear the marker only when the active correction is resolved;
- the marker must be absent at successful architect handoff.

Architect review may create this marker directly for a repository-visible correction. The operator still reruns only `material-component <name>`.

## Resume invariants

- A new contract artifact is durable only when its worker returned `complete`; blocked workers must not leave new partial contract files.
- Existing artifacts are reusable only when they pass the current-rules compatibility gate and no pending correction targets them.
- A fresh agent does not rerun completed stages merely because previous chat context is unavailable.
- An interrupted correction resumes automatically from `.material-correction.json`.
- An interrupted implementation resumes inside the implementation worker from current family files unless a pending correction targets an earlier owner.
- Do not rewrite already-correct contracts/docs or regenerate unrelated proof merely to normalize output during a correction.
- If repository state is ambiguous enough that the next stage cannot be determined mechanically and no pending marker resolves it, return `needs-architect` instead of rerunning the whole pipeline.
- After two unsuccessful correction rounds for the same underlying problem, return to the architect.

## Internal worker handoff

The orchestrator derives this block from `.material-correction.json` or a worker route; the operator does not supply it:

```text
family: <canonical family>
owner: <api-contract | token-contract | behavior-contract | implementation | migration>
finding: <one exact defect>
affected scope: <concise contract/proof/consumer scope>
operator observation: none | <lossless factual observation>
```

Pass it unchanged to the targeted worker. Do not turn a focused correction into a fresh family audit.

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
pending correction: none | <owner and scope>
operator observations: none | <status>
focused verification: <summary>
remaining blocker: none | <exact blocker>
next action: hand to architect | rerun material-component <name> | <genuine external action>
```

## Forbidden

- Requiring the operator to reconstruct or paste a correction handoff.
- Reusing one worker context for multiple responsibilities.
- Running token/behavior before API is complete for a new/reopened API contract.
- Reintroducing a combined Material definition worker.
- Combining standalone implementation and consumer migration.
- Re-running completed stages without a current incompatibility, pending correction, worker route, or structural incompleteness.
- Using a full fresh pipeline as a substitute for missing prior-chat context.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Performing stage-owned semantic reasoning in the orchestrator.
- Persisting worker narratives or workflow history as recovery state.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
