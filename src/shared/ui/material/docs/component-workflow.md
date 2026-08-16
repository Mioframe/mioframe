# Material component workflow

## Decision

One official Material family is implemented through three focused technical contracts and two coding stages:

```text
API CONTRACT
     ↓
TOKEN CONTRACT ─┐
                ├─→ CONTRACT READY → IMPLEMENTATION → MIGRATION IF REQUIRED → ARCHITECT REVIEW / CI
BEHAVIOR CONTRACT┘
```

The API contract runs first because it establishes the canonical current structural surface: developer-selectable configurations, content roles, public values and defaults. Token and behavior workers may then run in parallel. They may read `contract.ts` only as that structural boundary; Material facts still come only from Material 3 MCP.

The coding workflow ends at architect handoff. Semantic PR review, exact-head CI review, roadmap completion, and merge readiness are architect-owned and are not duplicated by another coding-agent review worker.

The only normal operator command is:

```text
material-component <name>
```

The operator is not responsible for remembering the current stage or carrying correction instructions between agent sessions. The workflow is resume-first and reconstructs its next action from repository state.

## Material source readiness

Before running a contract worker, mechanically verify that the repository-configured `material3` MCP source for the selected component is readable and current enough for that worker.

If the source is missing or stale because the local cache needs refresh, perform one normal non-forced full refresh and recheck. Do not use `force`, `promotePartial`, reduced `maxPages`, web search, memory, or another documentation source to bypass a source failure.

Do not repeat source refresh/check work merely because implementation, migration, or architect review is being resumed from already-complete contracts.

## Contract workers

### API contract

Run `material-component-api-contract` first in a fresh isolated context.

It owns only:

```text
components/<family>/contract.ts
```

It establishes the current public structural boundary from Material 3 MCP without reading m3e, legacy code or consumers.

### Token and behavior contracts

After API completes, run these in separate fresh contexts; they may run in parallel when writes are safely isolated:

```text
material-component-token-contract
  → components/<family>/tokens.css

material-component-behavior-contract
  → components/<family>/BEHAVIOR.md
```

Both may read `contract.ts` only to reuse the already-established current configuration/content-role boundary and public terminology. They must independently query Material 3 MCP for the facts in their own scope. They must not copy facts from `contract.ts`, reinterpret it to fit m3e, or edit it.

If Material evidence in token/behavior scope proves `contract.ts` structurally wrong or incomplete, report `return-to-api-contract` with the exact contradiction instead of compensating locally.

## Contract artifact atomicity

A contract artifact is a durable completed-stage artifact only when its worker returns `complete`.

For a new/missing contract:

1. finish Material source inspection first;
2. perform the worker completion check;
3. write/replace the owned artifact only after that check can return `complete`.

If the worker is blocked, it must not create a partial owned artifact.

A completed file is not automatically trusted forever. Before reuse, the orchestrator applies the current-rules compatibility gate below and checks for pending repository-local correction state.

## Current-rules compatibility gate

Before choosing the next stage, inspect the current family files against deterministic repository rules that can be checked without re-deriving Material or renderer semantics.

This gate exists so rule changes can invalidate obviously stale artifacts without requiring an operator-provided correction.

It may check only explicit local invariants, for example:

- mandatory artifact presence/shape;
- public contracts contain no renderer/private vocabulary or implementation helpers;
- `tokens.css` keeps component-token defaults on the stable family block selector rather than `:root`;
- public `tokens.css` contains no `--m3e-*`, `--md-private-*`, application tokens, renderer bridges, or non-CSS token catalogue machinery;
- current runtime contains no TypeScript token-name catalogue/generated custom-property mapping machinery forbidden by the adapter/token rules;
- `BEHAVIOR.md` contains only the behavior-contract sections/concerns and not implementation, tests, migration, or workflow state;
- legacy DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW artifacts are not treated as current-stage completion records.

The gate must not:

- decide whether an upstream Material fact is correct/current;
- infer Material semantics from naming heuristics;
- inspect m3e behavior to judge renderer fidelity;
- inspect consumers to re-derive public demand;
- act as a semantic family review.

When one deterministic incompatibility maps to one owner, persist that exact correction in the recovery marker and run the owner automatically. When ownership cannot be determined mechanically, use `needs-architect`; do not guess or rebuild the full pipeline.

## Durable correction recovery

A correction discovered by a worker or architect must survive context loss and token-limit interruption without requiring the operator to paste it back into the next run.

While one correction is active, store it at:

```text
components/<family>/.material-correction.json
```

Shape:

```json
{
  "owner": "api-contract | token-contract | behavior-contract | implementation | migration",
  "finding": "one exact unresolved defect",
  "affectedScope": "concise contract/proof/consumer scope"
}
```

This is transient workflow recovery state only. It is not one of the three Material contracts, not a source ledger, not a review artifact, and not completion metadata.

Rules:

1. Keep exactly one active owner.
2. Persist the marker before routing to another worker or returning with an unresolved correction.
3. Consolidate multiple currently known findings for that same owner into one concise `finding`/`affectedScope`; do not create a queue of micro-findings.
4. Do not store timestamps, hashes, counters, worker reports, hidden reasoning, Git/PR/CI state, or proposed fixes.
5. If the targeted worker completes and returns another correction owner, replace the marker atomically before continuing.
6. Clear the marker only after the active correction is resolved and no replacement route is returned.
7. The marker must not exist at successful architect handoff.
8. Architect review may create the marker directly for a repository-visible correction. The operator still invokes only `material-component <name>`.

This marker is deliberately smaller than a workflow database: it remembers only the one unresolved fact that cannot always be reconstructed safely from files after an interrupted semantic worker.

## Resume rules

The orchestrator determines the next action in this order:

1. Resolve the family and inspect current files.
2. Read `.material-correction.json` when present.
3. Run the current-rules compatibility gate.
4. If a pending correction exists, run its exact owner first.
5. Otherwise, if `contract.ts` is missing, run API only.
6. If `contract.ts` exists and either `tokens.css` or `BEHAVIOR.md` is missing, run only the missing token/behavior workers.
7. When all three contracts exist and are compatible, run/continue standalone implementation when it is not complete for the current repository state.
8. Run migration only when current consumers or replaced legacy ownership still require migration.
9. When the current invocation has completed implementation and any required migration and no pending marker remains, stop and hand the family to the architect.

A completed contract worker is not rerun merely because a fresh agent lacks previous chat context.

An interrupted correction resumes from `.material-correction.json`. The operator does not reconstruct the correction handoff.

An interrupted implementation resumes from current family runtime/proof unless a pending correction targets an earlier owner.

If repository state is ambiguous enough that the next stage cannot be determined mechanically and no recovery marker resolves it, return `needs-architect` instead of rebuilding the pipeline.

## Contract-ready gate

Standalone implementation may start when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist as completed compatible contract artifacts;
- `.material-correction.json` is absent or does not target a contract owner;
- token/behavior workers reported no unresolved `return-to-api-contract` contradiction;
- the three artifacts have no direct structural contradiction visible without re-deriving Material semantics.

Implementation does not perform another Material definition pass.

## Standalone implementation

Run `material-component-implementation` in one fresh context.

Inputs are only the three fixed contracts, applicable Material adapter/token rules, exact lockfile-resolved `@m3e/web` documentation/public artifacts, and component-owned proof conventions.

The implementation worker owns:

- canonical Vue runtime;
- private renderer mapping;
- canonical exports;
- component-owned unit/browser/visual proof;
- focused verifier-managed checks.

It must not inspect application consumers or migrate legacy call sites.

If implementation proves a contract wrong, return the exact owner (`api-contract`, `token-contract`, or `behavior-contract`) and stop. The orchestrator persists that route before another worker starts. Do not rewrite the contract inside implementation.

An interrupted implementation is resumed by the implementation worker from current family files; it does not reopen completed contracts unless the recovery marker targets one.

## Migration

Run `material-component-migration` in a separate fresh context only when migration work is actually required.

For a first family conversion, migration inventories consumers, adapts them to the finished canonical API, preserves product-owned behavior, removes replaced legacy ownership, and runs focused consumer proof.

For a correction to an already-migrated family, skip migration when the correction does not require any consumer change and legacy ownership is already gone. Adding an optional public configuration with an unchanged default, for example, does not by itself require another migration worker.

Migration does not inspect m3e internals and does not redefine Material contracts.

If migration returns an upstream correction, persist it before routing or returning.

## Correction routing

Correction runs are targeted:

```text
api-contract
  → API contract worker → token/behavior only when API correction invalidates their scope → implementation → migration only if consumer usage changed → architect

token-contract
  → token contract worker → implementation → architect

behavior-contract
  → behavior contract worker → implementation → migration only if consumer composition changed → architect

implementation
  → implementation worker → architect

migration
  → migration worker → architect

architecture / unclear ownership
  → architect
```

Do not rerun unaffected contracts or coding stages. After two unsuccessful correction rounds for the same underlying problem, stop patching and return to architecture.

## Worker handoffs

Repository files are the durable implementation handoff. The transient recovery marker is the durable unresolved-correction handoff.

Between coding workers pass only the exact correction fields from that marker plus lossless operator observations that materially affect that worker.

Do not pass hidden reasoning, previous narrative reports, copied source encyclopedias, Git/PR history, or unrelated logs between workers.

## Status ownership

Coding stages must not mark the Material roadmap, PR, or family as architect-reviewed, CI-ready, merge-ready, or complete for the program.

`docs/roadmap.md` is updated only after architect review establishes the truthful resulting status. An interrupted coding run therefore cannot leave a false `no blocker` / `review complete` milestone behind.

## Completion

The coding-agent workflow is complete when:

- the three technical contracts exist, pass current-rules compatibility, and no pending correction targets them;
- standalone implementation and required proof are complete in the current/resumed implementation run;
- required consumer migration and legacy removal are complete, or migration is explicitly not required for the correction;
- focused local verification required for the edited contracts has completed or an exact external blocker is reported;
- `.material-correction.json` is absent.

The final action is always handoff to the architect for semantic review, PR handling, exact-head CI, roadmap update, and merge readiness.