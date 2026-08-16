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

The normal operator entrypoint remains:

```text
material-component <name>
```

The workflow is resume-first. Repository artifacts are durable stage results; a repeated invocation continues from current repository state instead of rebuilding completed work.

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

For an architect correction that reopens an existing contract, the correction handoff remains the authoritative invalidation until the corrected worker returns `complete`. If that correction run is interrupted, repeat the same correction handoff on the next invocation; file existence alone does not cancel an active architect correction.

## Resume rules

The orchestrator first inspects current family files and any exact architect correction handoff.

Without an explicit correction handoff:

1. If `contract.ts` is missing, run API only.
2. If `contract.ts` exists and either `tokens.css` or `BEHAVIOR.md` is missing, run only the missing token/behavior workers.
3. When all three contracts exist, run/continue standalone implementation for a family not yet handed to the architect as implementation-complete.
4. Run migration only when current consumers or replaced legacy ownership still require migration.
5. When the current invocation has completed implementation and any required migration, stop and hand the family to the architect.

A completed contract worker is not rerun because a fresh agent lacks prior chat context.

A correction may reopen a completed stage only through an exact architect handoff using this shape:

```text
family: <canonical family>
owner: <api-contract | token-contract | behavior-contract | implementation | migration | architect>
finding: <one exact defect>
affected scope: <concise contract/proof/consumer scope>
```

Pass that block unchanged to the targeted worker. Do not broaden it into a general re-review request.

If repository state is ambiguous enough that the next stage cannot be determined mechanically, return `needs-architect` instead of rebuilding the pipeline.

## Contract-ready gate

Standalone implementation may start when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist as completed contract artifacts;
- no current correction still targets a contract;
- token/behavior workers reported no `return-to-api-contract` contradiction;
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

If implementation proves a contract wrong, return the exact owner (`api-contract`, `token-contract`, or `behavior-contract`) and stop. Do not rewrite the contract inside implementation.

An interrupted implementation is resumed by the implementation worker from current family files; it does not reopen completed contracts.

## Migration

Run `material-component-migration` in a separate fresh context only when migration work is actually required.

For a first family conversion, migration inventories consumers, adapts them to the finished canonical API, preserves product-owned behavior, removes replaced legacy ownership, and runs focused consumer proof.

For a correction to an already-migrated family, skip migration when the correction does not require any consumer change and legacy ownership is already gone. Adding an optional public configuration with an unchanged default, for example, does not by itself require another migration worker.

Migration does not inspect m3e internals and does not redefine Material contracts.

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

## Handoffs

Repository files are the durable implementation handoff. Between coding workers pass only the exact correction block plus lossless operator observations that materially affect that worker.

Do not pass hidden reasoning, previous narrative reports, copied source encyclopedias, Git/PR history, or unrelated logs between workers.

## Status ownership

Coding stages must not mark the Material roadmap, PR, or family as architect-reviewed, CI-ready, merge-ready, or complete for the program.

`docs/roadmap.md` is updated only after architect review establishes the truthful resulting status. An interrupted coding run therefore cannot leave a false `no blocker` / `review complete` milestone behind.

## Completion

The coding-agent workflow is complete when:

- the three technical contracts exist and no current correction targets them;
- standalone implementation and required proof are complete in the current/resumed implementation run;
- required consumer migration and legacy removal are complete, or migration is explicitly not required for the correction;
- focused local verification required for the edited contracts has completed or an exact external blocker is reported.

The final action is always handoff to the architect for semantic review, PR handling, exact-head CI, roadmap update, and merge readiness.
