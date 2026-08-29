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

Completed work lives in repository artifacts and proof. Unresolved coding state has two forms:

- mechanical compatibility: recompute with `node scripts/materialComponentCompatibility.mjs --family <family>`;
- semantic correction that cannot be reconstructed mechanically: `src/shared/ui/material/components/<family>/.material-correction.json`.

Owner-local `REVIEW.md` is architect-owned review state, not a coding correction queue. Coding workers must not select, update, or clear review findings themselves.

Owner order is:

```text
api-contract → token-contract → behavior-contract → implementation → migration
```

`test-authoring` does not add another Material owner or persisted workflow stage. When implementation-owned proof needs a new/materially changed assertion oracle, the implementation owner delegates only proof authorship/RED evidence to a fresh test-author context under the root testing architecture. The proof remains owned by the Material family and implementation owner; production implementation and proof authorship remain separate contexts.

The semantic marker stores exactly:

```json
{
  "owner": "api-contract | token-contract | behavior-contract | implementation | migration",
  "finding": "one exact unresolved defect",
  "affectedScope": "concise affected scope"
}
```

Keep only one active semantic correction. Do not store deterministic findings, timestamps, hashes, counters, worker transcripts, hidden reasoning, Git/PR/CI state, proposed fixes, or workflow progress. Clear the marker only after its finding is resolved and no replacement semantic correction is returned.

## Temporary legacy-family bridge

Pre-workflow families may still contain `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, or `MIGRATION.md`. Their presence means that family has not yet completed conversion to the current three-contract workflow.

The old workflow did not create `BEHAVIOR.md`. It could already contain a demand-scoped `tokens.css`, so that file alone must not let conversion skip the current token contract.

Use one temporary rule only:

```text
legacy staged artifacts remain
+ current contract.ts exists
+ current BEHAVIOR.md does not exist
→ treat token-contract as the earliest incomplete owner after any earlier api-contract route
```

Run that token worker normally, rerun the resolver, and continue through behavior and the ordinary owner order. If execution stops after token completion but before `BEHAVIOR.md` is written, a fresh invocation may repeat token derivation once. That bounded duplicate work is intentionally preferred over a completion manifest, token identity marker, or workflow-history database.

While legacy staged artifacts remain, an old `REVIEW.md` with `Verdict: compliant` is historical evidence and is ignored as current `project-review` state. Current review verdicts remain `blocked`, `ready-with-listed-risks`, and `ready`.

Migration removes replaced legacy staged artifacts after successful conversion. Once all legacy families are converted, remove this temporary bridge from the workflow rather than retaining permanent compatibility logic.

## Execute

1. Resolve the canonical Material family and preserve any concrete operator observations losslessly.
2. Read `.material-correction.json` if present. Detect whether legacy staged artifacts remain. If a legacy `REVIEW.md` says `Verdict: compliant`, treat it only as historical evidence; otherwise do not use review contents as coding instructions.
3. Run exactly:
   ```text
   node scripts/materialComponentCompatibility.mjs --family <family>
   ```
   Treat `route` as routing, not failed verification. If the resolver cannot execute or returns invalid output, return that exact failure; do not replace it with an LLM compatibility audit.
4. Determine the earliest owner from:
   - semantic marker;
   - resolver route;
   - the temporary legacy rule above, which contributes `token-contract` only when its three conditions hold.
5. Run only that owner in a fresh context. Pass only family, owner, exact finding/scope when one exists, and relevant operator observations.
6. If the worker returns a semantic correction, persist or replace the marker before routing elsewhere. If it resolves the active semantic correction without replacement, clear the marker.
7. Rerun the resolver after every completed owner and recalculate the earliest owner. Do not pre-plan a correction chain and do not rerun unaffected owners, except for the explicitly accepted repeated token derivation when resuming the temporary legacy boundary.
8. When all three contracts are ready, no earlier route exists, and no contract correction is pending, run or resume `material-component-implementation` as the `implementation` owner until its completion gate returns `complete`. Inside that owner, follow the root independent-proof rule: fresh `test-authoring` contexts may author/validate required assertion-bearing proof or independently accept an intentional visual baseline, but they do not become Material owners, alter resolver order, or create `.material-correction.json` workflow state merely because proof authorship was delegated.
9. Run `material-component-migration` only when current consumers or replaced legacy ownership actually require migration. A correction with unchanged public usage/defaults and no legacy ownership does not require another migration pass.
10. When contracts, implementation/proof, and required migration are complete, the resolver is clean, and no semantic marker remains, inspect only active current review state:
    - no active current review artifact: normal architect handoff;
    - `ready` or `ready-with-listed-risks`: hand to architect; do not claim CI/merge readiness;
    - `blocked`: stop at architect handoff and report that active review findings require architect re-review/routing. Do not select a finding yourself or continue coding without a resolver/marker route.

A fresh session resumes from repository state. Lack of previous chat context is never a reason to rerun the whole family.

After two unsuccessful correction rounds for the same underlying problem, or when ownership cannot be resolved by the resolver/marker/stage gates, return `needs-architect`.

## Worker boundaries

- `material-component-api-contract`: owns only `contract.ts`; Material facts from Material3 MCP.
- `material-component-token-contract`: owns only `tokens.css`; Material facts from Material3 MCP.
- `material-component-behavior-contract`: owns only `BEHAVIOR.md`; Material facts from Material3 MCP.
- `material-component-implementation`: owns standalone Vue/m3e adaptation and responsibility for complete component-owned proof; no consumers. New/materially changed assertion-bearing proof may be authored in a separate `test-authoring` context without moving repository ownership away from this implementation owner/family.
- `material-component-migration`: owns consumers and removal of replaced legacy ownership; does not redefine Material or inspect m3e internals.
- Architect: owns final semantic review, `REVIEW.md`, roadmap/PR metadata, exact-head CI review, and merge readiness.

API runs first. Token and behavior may use completed `contract.ts` only as the structural scope/terminology boundary and return to API when their Material evidence proves that boundary wrong.

## Verification ownership

Follow the root rules and `.agents/skills/verification/SKILL.md`; do not define a second Material-specific verification protocol or environment model.

Focused `pnpm verify --only ...` commands are optional implementation/diagnostic feedback or narrow task-specific proof. Material coding workers do not run a mandatory final automatic repository verification solely for handoff.

Verifier invocation, permission handling, and environment failures are owned exclusively by the `verification` skill. Do not preflight verifier internals or ask the operator to run verifier commands.

Exact-head GitHub CI is architect-owned and is the final automatic repository verification gate.

## Completion

The coding workflow is complete only when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` are ready and the resolver has no contract route;
- no semantic correction remains;
- implementation returned `complete` for runtime and required component-owned proof, including any required independent test-author/baseline pass;
- migration returned `complete` or `not-required`;
- no known in-scope coding blocker remains.

An active current owner-local `REVIEW.md` with `Verdict: blocked` remains known blocker state until architect re-review. Legacy `Verdict: compliant` evidence is not current review state.

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
local feedback: none | <focused verifier-managed proof/diagnostics actually used>
remaining blocker: none | active architect review requires re-review/routing | <exact blocker>
next action: hand to architect | rerun material-component <name> | <genuine external action>
```

## Forbidden

- Requiring the operator to reconstruct workflow state or paste a correction handoff.
- Re-implementing deterministic resolver compatibility checks in LLM reasoning.
- Treating legacy `Verdict: compliant` as active current review state.
- Treating current `REVIEW.md` as a coding-agent review queue or independently clearing architect findings.
- Persisting mechanically recomputable findings or legacy transition progress in `.material-correction.json`.
- Adding a workflow-history database, completion manifest, token-contract identity marker, or permanent legacy compatibility layer.
- Combining contract, implementation, or migration responsibilities in one worker context.
- Treating `test-authoring` as a sixth Material owner/stage or persisting its context boundary as workflow state.
- Rerunning completed current-workflow owners without an actual route.
- Asking the operator to run verifier commands.
- Reintroducing a coding-agent Material review stage.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
- Requiring a final broad local verification run solely to duplicate CI.
