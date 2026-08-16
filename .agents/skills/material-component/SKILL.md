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

Read applicable `AGENTS.md` and `src/shared/ui/material/docs/component-workflow.md`. That document owns sequencing, source readiness, deterministic compatibility routing, semantic recovery state, correction routing, and completion.

This skill owns orchestration only.

## Execute

1. Resolve the canonical Material family.
2. Read the family-local `.material-correction.json` when it exists.
3. Run the repository-owned deterministic route resolver inside the normal agent sandbox:

   ```text
   node scripts/materialComponentCompatibility.mjs --family <family>
   ```

   The command returns one compact JSON result: `clean`, or `route` with the earliest mechanically stale owner and exact violations.
4. Choose the earliest owner between a pending semantic correction and a deterministic `route`, using:

   ```text
   api-contract → token-contract → behavior-contract → implementation → migration
   ```

   A deterministic route is recomputable and is not persisted. A pending semantic correction remains stored until its own finding is resolved.
5. Run only the selected owner. After it completes, rerun the deterministic resolver before selecting another stage.
6. When the resolver is `clean` and no semantic correction is pending, continue only the genuinely incomplete downstream work: implementation proof, then migration when consumers or legacy ownership still require it.
7. Keep every worker in a separate fresh context. Never combine contract, implementation, or migration responsibilities.
8. When a worker returns a semantic correction route that cannot be reconstructed mechanically, persist it to `.material-correction.json` before launching another worker or returning control.
9. Clear `.material-correction.json` only after its targeted semantic correction completes and no replacement semantic correction is returned.
10. Validate structured worker results and required artifact/proof existence at gates.
11. Preserve concrete operator observations without inventing causes or fixes.
12. Stop at architect handoff. Do not run an independent coding-agent semantic review or claim PR/CI/merge readiness.

The orchestrator must not design API/tokens/behavior, inspect Material or m3e semantics, implement code, migrate consumers, semantically review the family, or update roadmap completion state.

## Deterministic compatibility resolver

`scripts/materialComponentCompatibility.mjs` owns only repository-visible structural compatibility with current rules. The orchestrator must use its result rather than re-implementing these checks in LLM reasoning.

The resolver may identify only mechanically provable conditions such as:

- missing mandatory contract/runtime artifacts;
- old Vue slot contract syntax that violates the current API artifact shape;
- renderer-private vocabulary inside `contract.ts`;
- component-token defaults declared on `:root`;
- private `--m3e-*` variables inside public `tokens.css`;
- Material/m3e custom-property mapping kept in runtime Vue/TypeScript instead of CSS.

It deliberately does **not** decide Material semantics, current-vs-baseline classification, m3e behavior/capability, accessibility meaning, motion fidelity, consumer demand, or migration correctness.

If the resolver command itself cannot execute or returns invalid output, do not fall back to a manual LLM compatibility audit. Return the exact execution/contract failure to the architect.

The resolver is workflow routing, not verification proof. It does not replace `pnpm verify ...` for edited code/tests.

## Durable semantic correction recovery

A semantic correction that cannot be recomputed mechanically is stored only while unresolved at:

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

- exactly one active semantic correction at a time;
- keep the finding factual and minimal;
- no timestamps, hashes, counters, worker transcripts, hidden reasoning, Git/PR/CI state, or speculative fix;
- when several known semantic defects share the same owner, consolidate them into one concise finding/scope;
- if a worker returns a different semantic owner, replace the marker atomically before routing;
- if the targeted worker completes but returns another semantic correction, replace rather than clear the marker;
- deterministic resolver findings are never copied into the marker because they are recomputable;
- clear the marker only when the active semantic correction is resolved;
- the marker must be absent at successful architect handoff.

Architect review may create this marker directly for a repository-visible semantic correction. The operator still reruns only `material-component <name>`.

## Resume invariants

- Existing artifacts are reusable only when the deterministic resolver no longer routes to their owner and no pending semantic correction targets them.
- A fresh agent does not rerun completed stages merely because previous chat context is unavailable.
- Mechanically stale state is rediscovered by the resolver after interruption; no recovery file is required.
- An interrupted semantic correction resumes automatically from `.material-correction.json`.
- An interrupted implementation resumes from current runtime/proof unless an earlier deterministic or semantic correction takes precedence.
- Do not rewrite already-correct contracts/docs or regenerate unrelated proof merely to normalize output during a correction.
- If current ownership cannot be determined by the resolver, a pending semantic correction, or the explicit stage gates, return `needs-architect` instead of rebuilding the whole pipeline.
- After two unsuccessful correction rounds for the same underlying problem, return to the architect.

## Internal worker handoff

The orchestrator derives this block from the deterministic resolver or `.material-correction.json`; the operator does not supply it:

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
pending semantic correction: none | <owner and scope>
operator observations: none | <status>
focused verification: <summary>
remaining blocker: none | <exact blocker>
next action: hand to architect | rerun material-component <name> | <genuine external action>
```

## Forbidden

- Requiring the operator to reconstruct or paste a correction handoff.
- Re-implementing deterministic compatibility checks in LLM reasoning instead of using the resolver.
- Falling back to a semantic audit when the resolver cannot execute.
- Persisting recomputable mechanical violations in `.material-correction.json`.
- Reusing one worker context for multiple responsibilities.
- Reintroducing a combined Material definition worker.
- Combining standalone implementation and consumer migration.
- Re-running completed stages without a deterministic incompatibility, pending semantic correction, worker route, or genuine incomplete stage.
- Using a full fresh pipeline as a substitute for missing prior-chat context.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Performing stage-owned semantic reasoning in the orchestrator.
- Persisting worker narratives or workflow history as recovery state.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
