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

Owner-local `REVIEW.md` is architect-owned semantic review state, not a coding correction queue. Coding workers must not reinterpret, update, or independently clear review findings. A blocked current review is still known in-scope state, however, so it must prevent a false `remaining blocker: none` claim after a routed correction finishes.

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

## Legacy staged-family transition

Pre-workflow families may still contain one or more old staged artifacts:

```text
DESIGN.md
ARCHITECTURE.md
IMPLEMENTATION.md
MIGRATION.md
```

Their presence means the family is still in legacy transition until migration removes the replaced staged artifacts. `REVIEW.md` alone is not a legacy-identity marker because the current architect review also uses that filename.

The old workflow did not create `BEHAVIOR.md`. Therefore, while legacy staged artifacts remain:

- an existing `tokens.css` is not by itself proof of a completed current token contract;
- an `api-contract` resolver/marker route still wins and must be resolved before token or behavior work;
- when `contract.ts` exists but `BEHAVIOR.md` does not, current token derivation must occur before current behavior derivation unless an active `behavior-contract` semantic marker proves that a previous behavior attempt was already reached;
- an active `token-contract` marker is resolved by the token worker before behavior; later implementation/migration markers do not bypass missing earlier contracts;
- do not insert a persistent completion marker merely to remember the token→behavior boundary;
- if execution is interrupted after token completion but before `BEHAVIOR.md` is written, the next invocation may repeat the token-contract derivation once before continuing to behavior. This bounded repeat is preferable to a workflow-history database or another artifact identity protocol;
- once current `BEHAVIOR.md` exists, ordinary resolver/marker routing resumes. Its presence is the durable downstream evidence that the current token→behavior definition sequence has crossed the legacy ambiguity boundary.

Legacy staged `REVIEW.md` files use `Verdict: compliant` and are historical evidence, not active current `project-review` state. While legacy staged artifacts remain:

- `Verdict: compliant` is ignored for current review routing;
- `Verdict: blocked`, `Verdict: ready-with-listed-risks`, and `Verdict: ready` are current review state;
- any other verdict is ambiguous and returns `needs-architect` rather than being guessed.

Migration removes replaced legacy staged artifacts only after the current family implementation and required consumer migration are complete.

## Execute

1. Resolve the canonical Material family and preserve any concrete operator observations losslessly.
2. Read `.material-correction.json` if present. Detect whether legacy staged artifacts remain. Classify owner-local `REVIEW.md` using the legacy/current rules above, but do not use the review document as implementation instructions.
3. Run exactly:
   ```text
   node scripts/materialComponentCompatibility.mjs --family <family>
   ```
   Treat `route` as routing, not failed verification. If the resolver cannot execute or returns invalid output, return that exact failure; do not replace it with an LLM compatibility audit.
4. Choose the earliest owner between the semantic marker and resolver route, except for the explicit legacy transition below.
5. Legacy transition exception: when legacy staged artifacts remain, `contract.ts` exists, `BEHAVIOR.md` is absent, neither resolver nor marker selects `api-contract`, and no active marker selects `behavior-contract`, run `material-component-token-contract` in a fresh context even if the existing legacy `tokens.css` is mechanically compatible. If an active marker selects `token-contract`, pass that exact correction to the token worker. If token completes without a return/blocker, clear any resolved token marker and run `material-component-behavior-contract` next in another fresh context. Do not rerun the resolver between these two legacy-transition owners; rerun it after behavior completes. If the session stops between them, a later invocation safely repeats token-contract as described above. If an active marker selects `behavior-contract`, skip this exception and run that behavior correction directly. Later implementation/migration markers do not override this earlier incomplete contract transition.
6. Outside that exception, run only the selected owner in a fresh context. Pass only family, owner, exact finding/scope, and relevant operator observations.
7. If a worker returns a semantic correction, persist or replace the marker before routing elsewhere. If it resolves the active semantic correction without replacement, clear the marker.
8. Rerun the resolver after every completed owner except the intentional token→behavior legacy-transition pair above. Do not pre-plan any other correction chain and do not rerun unaffected owners.
9. When all three contracts are ready, no earlier route exists, and no contract correction is pending, run or resume `material-component-implementation` until its own completion gate returns `complete`.
10. Run `material-component-migration` only when current consumers or replaced legacy ownership actually require migration. A correction with unchanged public usage/defaults and no legacy ownership does not require another migration pass.
11. When contracts, implementation/proof, and required migration are complete, the resolver is clean, and no semantic marker remains, inspect only active current review state:
    - no active current review artifact: normal architect handoff;
    - `ready` or `ready-with-listed-risks`: hand to architect; do not claim CI/merge readiness;
    - `blocked`: stop at architect handoff and report that active review findings require architect re-review/routing. Do not claim `remaining blocker: none`, do not select a review finding yourself, and do not continue coding without a resolver/marker route.

A fresh session resumes from repository state. Lack of previous chat context is never a reason to rerun the whole family.

After two unsuccessful correction rounds for the same underlying problem, or when ownership cannot be resolved by the resolver/marker/stage gates, return `needs-architect`.

## Worker boundaries

- `material-component-api-contract`: owns only `contract.ts`; Material facts from Material3 MCP.
- `material-component-token-contract`: owns only `tokens.css`; Material facts from Material3 MCP.
- `material-component-behavior-contract`: owns only `BEHAVIOR.md`; Material facts from Material3 MCP.
- `material-component-implementation`: owns standalone Vue/m3e adaptation and component-owned proof; no consumers.
- `material-component-migration`: owns consumers and removal of replaced legacy ownership; does not redefine Material or inspect m3e internals.
- Architect: owns final semantic review, `REVIEW.md`, roadmap/PR metadata, exact-head CI review, and merge readiness.

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

An active current owner-local `REVIEW.md` with `Verdict: blocked` is known in-scope blocker state until the architect re-reviews and updates/removes it. Legacy `Verdict: compliant` evidence is not current review state. Coding workers do not decide that a current review finding is resolved merely because their routed correction passed verification.

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
remaining blocker: none | active architect review requires re-review/routing | <exact blocker>
next action: hand to architect | rerun material-component <name> | <genuine external action>
```

## Forbidden

- Requiring the operator to reconstruct workflow state or paste a correction handoff.
- Re-implementing deterministic resolver compatibility checks in LLM reasoning.
- Treating legacy `Verdict: compliant` review evidence as active current review state.
- Treating current `REVIEW.md` as a coding-agent review queue or independently clearing architect findings.
- Claiming `remaining blocker: none` while active current `REVIEW.md` is still `blocked`.
- Persisting mechanically recomputable findings or legacy transition progress in `.material-correction.json`.
- Adding a workflow-history database, completion manifest, or token-contract identity marker solely for legacy transition.
- Combining contract, implementation, or migration responsibilities in one worker context. The explicit legacy token→behavior pair still runs as two fresh worker contexts.
- Rerunning completed owners without an actual route, incomplete downstream legacy transition, or incomplete downstream stage.
- Asking the operator to run `pnpm verify`, Playwright, Podman, or other verifier commands.
- Reintroducing a coding-agent Material review stage.
- Letting m3e, legacy code, or current consumer demand define Material contracts.
- Updating roadmap/PR/CI/merge status as coding-agent completion.
