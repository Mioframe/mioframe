# Material component workflow

## Decision

One official Material family is implemented through three focused technical contracts and two coding stages:

```text
API CONTRACT       ┐
TOKEN CONTRACT     ├─→ CONTRACT READY → IMPLEMENTATION → MIGRATION IF REQUIRED → ARCHITECT REVIEW / CI
BEHAVIOR CONTRACT  ┘
```

The coding workflow ends at architect handoff. Semantic PR review, exact-head CI review, roadmap completion, and merge readiness are architect-owned and are not duplicated by another coding-agent review worker.

The normal operator entrypoint remains:

```text
material-component <name>
```

The workflow is resume-first. Repository artifacts are durable stage results; a repeated invocation continues from the current stage instead of rebuilding completed work.

## Material source readiness

Before running a contract worker, mechanically verify that the repository-configured `material3` MCP source for the selected component is readable and current enough for that worker.

If the source is missing or stale because the local cache needs refresh, perform one normal non-forced full refresh and recheck. Do not use `force`, `promotePartial`, reduced `maxPages`, web search, memory, or another documentation source to bypass a source failure.

Do not repeat source refresh/check work merely because implementation, migration, or architect review is being resumed from already-written contracts.

## Contract workers

Exactly three fresh isolated definition workers own the canonical technical contracts:

```text
material-component-api-contract
  → components/<family>/contract.ts

material-component-token-contract
  → components/<family>/tokens.css

material-component-behavior-contract
  → components/<family>/BEHAVIOR.md
```

Material facts come only from the repository-configured `material3` MCP server.

The workers do not inspect m3e, legacy implementation, application consumers/current demand, or another contract worker's reasoning.

The three workers may run in parallel for a new family when their writes are isolated safely. Parallelism is an optimization, not a requirement.

## Resume rules

The orchestrator first inspects the current family files and determines the earliest structurally incomplete stage.

Without an explicit correction handoff:

1. Run only missing contract workers.
2. When all three contracts exist and are complete, run standalone implementation only if the canonical runtime/proof is not complete.
3. Run migration only when current consumers or replaced legacy ownership still require migration.
4. When contracts, standalone runtime/proof, and required migration are already present, stop and hand the current family to the architect. Do not regenerate contracts or perform a self-review to search for new work.

A completed contract worker is not rerun simply because `material-component <name>` is invoked in a fresh agent session.

To reopen a completed stage, require an exact correction handoff naming the owner and finding. A correction discovered by the architect is authoritative routing input for the coding workflow; the orchestrator does not reconstruct the previous review from chat history or guess what should be rerun.

If repository state is too ambiguous to determine whether an existing stage is complete, return `needs-architect` instead of conservatively rebuilding the full pipeline.

## Contract-ready gate

Standalone implementation may start when:

- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist;
- the corresponding worker results are complete for any contract worker run in the current invocation;
- no current correction handoff still targets a contract;
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

## Migration

Run `material-component-migration` in a separate fresh context only when migration work is actually required.

For a first family conversion, migration inventories consumers, adapts them to the finished canonical API, preserves product-owned behavior, removes replaced legacy ownership, and runs focused consumer proof.

For a correction to an already-migrated family, skip migration when the correction does not require any consumer change and legacy ownership is already gone. Adding an optional public configuration with an unchanged default, for example, does not by itself require another migration worker.

Migration does not inspect m3e internals and does not redefine Material contracts.

## Correction routing

Correction runs are targeted:

```text
api-contract
  → API contract worker → implementation → migration only if consumer-facing usage changed → architect

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

Pass only the minimum durable state needed by the next coding worker:

```text
family: <canonical family>
owner: <target worker>
finding: <exact contract or observable defect>
affected scope: <concise files/contract/proof>
operator observation: none | <lossless factual observation>
```

Repository files remain the durable implementation handoff. Do not pass hidden reasoning, previous narrative reports, copied source encyclopedias, Git/PR history, or unrelated logs between workers.

No extra workflow-status artifact is required. The architect supplies exact correction findings when a completed stage must be reopened.

## Status ownership

Coding stages must not mark the Material roadmap, PR, or family as architect-reviewed, CI-ready, merge-ready, or complete for the program.

`docs/roadmap.md` is updated only after architect review establishes the truthful resulting status. An interrupted coding run therefore cannot leave a false `no blocker` / `review complete` milestone behind.

## Completion

The coding-agent workflow is complete when:

- the three technical contracts exist and no current correction targets them;
- standalone implementation and required proof are complete;
- required consumer migration and legacy removal are complete, or migration is explicitly not required for the correction;
- focused local verification required for the edited contracts has completed or an exact external blocker is reported.

The final action is always handoff to the architect for semantic review, PR handling, exact-head CI, roadmap update, and merge readiness.
