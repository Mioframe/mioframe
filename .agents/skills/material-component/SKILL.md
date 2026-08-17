---
name: material-component
description: 'Use with one official Material component name to autonomously resume its contracts, standalone implementation/proof, and required migration from repository state.'
---

# Material component

The operator-facing entrypoint is always:

```text
material-component <name>
```

Do not require a stage, previous report, or correction handoff.

This skill is the single executable source of truth for Material component sequencing and resume. `src/shared/ui/material/docs/component-workflow.md` explains the architecture; worker skills own their semantics; `verification` owns verifier execution.

## State and owner order

Completed work lives in repository artifacts and proof. Unresolved state has two forms:

- mechanical compatibility: recompute with `node scripts/materialComponentCompatibility.mjs --family <family>`;
- semantic correction that cannot be reconstructed mechanically: `src/shared/ui/material/components/<family>/.material-correction.json`.

Owner order is:

```text
api-contract → token-contract → behavior-contract → implementation → migration
```

The semantic marker stores exactly:

```json
{
  "owner": "api-contract | token-contract | behavior-contract | implementation | migration",
  "finding": "one exact unresolved defect",
  "affectedScope": "concise affected scope"
}
```

Keep only one active semantic correction. Do not store deterministic findings, timestamps, hashes, counters, worker transcripts, hidden reasoning, Git/PR/CI state, or proposed fixes. Clear the marker only after its finding is resolved and no replacement semantic correction is returned.

## Execute

1. Resolve the canonical Material family and preserve any concrete operator observations losslessly.
2. Read `.material-correction.json` if present.
3. Run exactly:
   ```text
   node scripts/materialComponentCompatibility.mjs --family <family>
   ```
   Treat `route` as routing, not failed verification. If the resolver cannot execute or returns invalid output, return that exact failure; do not replace it with an LLM compatibility audit.
4. Choose the earliest owner between the semantic marker and resolver route.
5. Run only that owner in a fresh context. Pass only family, owner, exact finding/scope, and relevant operator observations.
6. If the worker returns a semantic correction, persist or replace the marker before routing elsewhere. If it resolves the active semantic correction without replacement, clear the marker.
7. Rerun the resolver after every completed owner. Do not pre-plan a correction chain and do not rerun unaffected owners.
8. When all three contracts are ready, no earlier route exists, and no contract correction is pending, run or resume `material-component-implementation` until its own completion gate returns `complete`.
9. Run `material-component-migration` only when current consumers or replaced legacy ownership actually require migration. A correction with unchanged public usage/defaults and no legacy ownership does not require another migration pass.
10. When contracts, implementation/proof, and required migration are complete, the resolver is clean, and no semantic marker remains, stop at architect handoff.

A fresh session resumes from repository state. Lack of previous chat context is never a reason to rerun the whole family.

After two unsuccessful correction rounds for the same underlying problem, or when ownership cannot be resolved by the resolver/marker/stage gates, return `needs-architect`.

## Worker boundaries

- `material-component-api-contract`: owns only `contract.ts`; Material facts from Material3 MCP.
- `material-component-token-contract`: owns only `tokens.css`; Material facts from Material3 MCP.
- `material-component-behavior-contract`: owns only `BEHAVIOR.md`; Material facts from Material3 MCP.
- `material-component-implementation`: owns standalone Vue/m3e adaptation and component-owned proof; no consumers.
- `material-component-migration`: owns consumers and removal of replaced legacy ownership; does not redefine Material or inspect m3e internals.
- Architect: owns final semantic review, roadmap/PR metadata, exact-head CI review, and merge readiness.

API runs first. Token and behavior may use completed `contract.ts` only as the structural scope/terminology boundary and return to API when their Material evidence proves that boundary wrong.

## Verification ownership

Coding workers run their required focused verifier-managed checks themselves.

If sandbox or Podman restrictions block a canonical `pnpm verify ...` invocation, follow the `verification` skill and use the runtime's narrowly scoped command approval/escalation path. **Do not ask the operator to run verifier commands.** If that mechanism itself is unavailable or fails, return `blocked` with the exact execution-environment failure.

Do not use broad local verification merely to duplicate architect-owned exact-head CI.

## Completion

The coding workflow is complete only when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` are ready and the resolver has no contract route;
- no semantic correction remains;
- implementation returned `complete` under its runtime/proof/verifier gate;
- migration returned `complete` or `not-required`;
- no known in-scope blocker remains.

Then hand the family to the architect. Coding workers do not update roadmap completion, claim PR/CI readiness, or perform another independent semantic review.

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

- Requiring the operator to reconstruct workflow state or paste a correction handoff.
- Re-implementing deterministic resolver checks in LLM reasoning.
- Persisting mechanically recomputable findings in `.material-correction.json`.
- Combining contract, implementation, or migration responsibilities in one worker context.
- Rerunning completed owners without an actual route or incomplete downstream stage.
- Asking the operator to run `pnpm verify`, Playwright, Podman, or other verifier commands.
- Reintroducing a coding-agent Material review stage.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
